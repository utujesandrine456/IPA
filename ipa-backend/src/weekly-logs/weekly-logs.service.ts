import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PDFDocument = require('pdfkit');

export type WeeklyLogStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

@Injectable()
export class WeeklyLogsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async findByStudent(studentId: number) {
        if (!studentId) {
            throw new BadRequestException('studentId is required');
        }

        return this.prisma.weeklyLog.findMany({
            where: { studentId },
            include: { dailyEntries: true },
            orderBy: { weekNumber: 'desc' },
        });
    }

    async findBySupervisor(supervisorId: number) {
        return this.prisma.weeklyLog.findMany({
            where: {
                student: {
                    supervisorId: supervisorId
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findByLiaison(liaisonId: number) {
        return this.prisma.weeklyLog.findMany({
            where: {
                student: {
                    liaisonId: liaisonId
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: { dailyEntries: true },
        });

        if (!log) throw new NotFoundException('Weekly log not found');
        return log;
    }

    async findOrCreateWeek(studentId: number, date: Date) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) throw new NotFoundException('Student not found');

        const startDate =
            student.internshipStart || new Date(date.getFullYear(), 0, 1);

        const diffInMs = date.getTime() - startDate.getTime();
        const weekNumber = Math.max(
            1,
            Math.ceil(diffInMs / (1000 * 60 * 60 * 24 * 7)),
        );

        const weekStart = new Date(date);
        weekStart.setDate(
            date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1),
        );
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        let weeklyLog = await this.prisma.weeklyLog.findUnique({
            where: {
                studentId_weekNumber: {
                    studentId,
                    weekNumber,
                },
            },
        });

        if (!weeklyLog) {
            weeklyLog = await this.prisma.weeklyLog.create({
                data: {
                    studentId,
                    weekNumber,
                    startDate: weekStart, // using the local weekStart variable but mapping to startDate field
                    endDate: weekEnd,     // using the local weekEnd variable but mapping to endDate field
                    status: 'DRAFT' as WeeklyLogStatus,
                },
            });
        }

        return weeklyLog;
    }

    async submitWeek(
        id: number,
        data: { generalStatement?: string },
    ) {
        const updateData: any = { status: 'SUBMITTED' as WeeklyLogStatus };
        if (data.generalStatement !== undefined) {
            updateData.generalStatement = data.generalStatement;
        }

        const weeklyLog = await this.prisma.weeklyLog.update({
            where: { id },
            data: updateData,
            include: {
                student: {
                    include: {
                        supervisor: true,
                    },
                },
            },
        });

        if (weeklyLog.student?.supervisor?.userId) {
            await this.notificationsService.createNotification({
                userId: weeklyLog.student.supervisor.userId,
                title: 'Weekly Log Submitted',
                message: `${weeklyLog.student.fullName} submitted Week ${weeklyLog.weekNumber}`,
                type: 'INFO',
            });
        }

        return weeklyLog;
    }

    async approveWeek(
        id: number,
        supervisorUserId: number,
        data: { note?: string; supervisorName?: string; supervisorDate?: string; grade?: string }
    ) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: { student: { include: { supervisor: true } } },
        });

        if (!log) throw new NotFoundException('Weekly log not found');

        if (log.student.supervisor.userId !== supervisorUserId) {
            throw new ForbiddenException(
                'You are not authorized to approve this log',
            );
        }

        const updatedLog = await (this.prisma.weeklyLog.update as any)({
            where: { id },
            data: {
                status: 'APPROVED' as WeeklyLogStatus,
                supervisorNote: data.note,
                supervisorName: data.supervisorName,
                supervisorDate: data.supervisorDate ? new Date(data.supervisorDate) : new Date(),
                supervisorSignature: true,
                grade: data.grade,
                approvedAt: new Date(),
            },
        });

        await this.notificationsService.createNotification({
            userId: log.student.userId,
            title: 'Weekly Log Approved',
            message: `Your Weekly Log for Week ${log.weekNumber} has been approved.`,
            type: 'SUCCESS',
            link: '/student/logbook',
        });

        return updatedLog;
    }

    async verifyLiaison(
        id: number,
        liaisonUserId: number,
        data: { liaisonName?: string; liaisonDate?: string }
    ) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: { student: { include: { liaison: true } } },
        });

        if (!log) throw new NotFoundException('Weekly log not found');

        if (log.student.liaison?.userId !== liaisonUserId) {
            throw new ForbiddenException(
                'You are not authorized to verify this log as a Liaison',
            );
        }

        const updatedLog = await this.prisma.weeklyLog.update({
            where: { id },
            data: {
                liaisonSignature: true,
                liaisonName: data.liaisonName,
                liaisonDate: data.liaisonDate ? new Date(data.liaisonDate) : new Date(),
            },
        });

        return updatedLog;
    }

    async rejectWeek(
        id: number,
        supervisorUserId: number,
        note: string,
    ) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: { student: { include: { supervisor: true } } },
        });

        if (!log) throw new NotFoundException('Weekly log not found');

        if (log.student.supervisor.userId !== supervisorUserId) {
            throw new ForbiddenException(
                'You are not authorized to reject this log',
            );
        }

        const updatedLog = await this.prisma.weeklyLog.update({
            where: { id },
            data: {
                status: 'REJECTED' as WeeklyLogStatus,
                supervisorNote: note,
            },
        });

        await this.notificationsService.createNotification({
            userId: log.student.userId,
            title: 'Weekly Log Revision Requested',
            message: `Supervisor requested revision for Week ${log.weekNumber}: ${note}`,
            type: 'WARNING',
            link: '/student/logbook',
        });

        return updatedLog;
    }

    async upsert(data: any) {
        const { studentId, weekNumber, ...rest } = data;

        const sId = Number(studentId);
        const wNum = Number(weekNumber);

        if (!sId || !wNum) {
            throw new BadRequestException(
                'studentId and weekNumber are required',
            );
        }

        rest.startDate = rest.startDate ? new Date(rest.startDate) : undefined;
        rest.endDate = rest.endDate ? new Date(rest.endDate) : undefined;
        rest.supervisorDate = (rest.supervisorDate && rest.supervisorDate !== "") ? new Date(rest.supervisorDate) : null;


        if (rest.mondayHours !== undefined) rest.mondayHours = Number(rest.mondayHours) || 8;
        if (rest.tuesdayHours !== undefined) rest.tuesdayHours = Number(rest.tuesdayHours) || 8;
        if (rest.wednesdayHours !== undefined) rest.wednesdayHours = Number(rest.wednesdayHours) || 8;
        if (rest.thursdayHours !== undefined) rest.thursdayHours = Number(rest.thursdayHours) || 8;
        if (rest.fridayHours !== undefined) rest.fridayHours = Number(rest.fridayHours) || 8;
        if (rest.totalHours !== undefined) {
            rest.totalHours =
                (Number(rest.mondayHours) || 8) +
                (Number(rest.tuesdayHours) || 8) +
                (Number(rest.wednesdayHours) || 8) +
                (Number(rest.thursdayHours) || 8) +
                (Number(rest.fridayHours) || 8);
        }


        const {
            id,
            createdAt,
            updatedAt,
            dailyEntries,
            student,
            ...sanitizedData
        } = rest;

        const existing = await this.prisma.weeklyLog.findFirst({
            where: { studentId: sId, weekNumber: wNum },
        });

        if (existing) {
            // Exclude fields that shouldn't be updated
            const { id, createdAt, updatedAt, dailyEntries, ...updateData } = rest;
            return this.prisma.weeklyLog.update({
                where: { id: existing.id },
                data: sanitizedData,
            });
        }

        return this.prisma.weeklyLog.create({
            data: {
                studentId: sId,
                weekNumber: wNum,
                ...sanitizedData,
            },
        });
    }

    async generatePdf(id: number, user: { userId: number; role: string }) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: true,
                        supervisor: { include: { user: true } },
                        liaison: { include: { user: true } },
                    },
                },
            },
        });

        if (!log) {
            throw new NotFoundException('Weekly log not found');
        }

        const isSupervisor = log.student.supervisor?.userId === user.userId;
        const isLiaison = log.student.liaison?.userId === user.userId;
        const isStudent = log.student.userId === user.userId;

        if (!isSupervisor && !isLiaison && !isStudent && user.role !== 'ADMIN') {
            throw new ForbiddenException('You are not allowed to download this log');
        }

        const doc = new PDFDocument({ margin: 40 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));

        doc.fontSize(18).text('Weekly Log Report', { align: 'center' }).moveDown();

        doc.fontSize(12)
            .text(`Student: ${log.student.fullName} (${log.student.user.email})`)
            .text(`Week: ${log.weekNumber}`)
            .text(
                `Period: ${log.startDate.toDateString()} - ${log.endDate.toDateString()}`,
            );

        if ((log as any).grade) {
            doc.text(`Grade: ${(log as any).grade}`);
        }

        doc.moveDown();

        if (log.student.companyName) {
            doc.text(`Company: ${log.student.companyName}`);
        }
        if (log.student.supervisor?.user?.name) {
            doc.text(`Supervisor: ${log.student.supervisor.user.name}`);
        }
        if (log.student.liaison?.user?.name) {
            doc.text(`Liaison Officer: ${log.student.liaison.user.name}`);
        }

        doc.moveDown();

        // Signatures/Verification section
        doc.fontSize(14).text('Verification Status', { underline: true }).moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Supervisor Signature: ${log.supervisorSignature ? 'YES' : 'NO'}`);
        if (log.supervisorDate) doc.text(`Supervisor Approved Date: ${log.supervisorDate.toDateString()}`);

        doc.moveDown(0.5);
        doc.text(`Liaison Signature: ${log.liaisonSignature ? 'YES' : 'NO'}`);
        if (log.liaisonDate) doc.text(`Liaison Verified Date: ${log.liaisonDate.toDateString()}`);
        if (log.liaisonName) doc.text(`Liaison Name: ${log.liaisonName}`);

        doc.moveDown();

        doc.fontSize(14).text('Daily Activities', { underline: true }).moveDown(0.5);
        doc.fontSize(11);

        const days = [
            { label: 'Monday', task: log.mondayTask, hours: log.mondayHours },
            { label: 'Tuesday', task: log.tuesdayTask, hours: log.tuesdayHours },
            { label: 'Wednesday', task: log.wednesdayTask, hours: log.wednesdayHours },
            { label: 'Thursday', task: log.thursdayTask, hours: log.thursdayHours },
            { label: 'Friday', task: log.fridayTask, hours: log.fridayHours },
        ];

        days.forEach((day) => {
            doc.font('Helvetica-Bold')
                .text(day.label, { continued: true })
                .font('Helvetica')
                .text(`  - Hours: ${day.hours ?? 0}`);
            if (day.task) {
                doc.text(day.task, { indent: 16 });
            }
            doc.moveDown(0.5);
        });

        if (log.generalStatement) {
            doc.moveDown().fontSize(14).text('General Statement', { underline: true });
            doc.moveDown(0.5).fontSize(11).text(log.generalStatement);
        }

        doc.end();

        return await new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}