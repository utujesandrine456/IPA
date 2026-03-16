import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const PDFDocument = require('pdfkit');

export type WeeklyLogStatus = 'DRAFT' | 'SUBMITTED' | 'COMPLETED' | 'REJECTED';

interface WeeklyLogEntry {
    weekNumber?: number | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    mondayTask?: string | null;
    mondayHours?: number | string | null;
    tuesdayTask?: string | null;
    tuesdayHours?: number | string | null;
    wednesdayTask?: string | null;
    wednesdayHours?: number | string | null;
    thursdayTask?: string | null;
    thursdayHours?: number | string | null;
    fridayTask?: string | null;
    fridayHours?: number | string | null;
    totalHours?: number | string | null;
    generalStatement?: string | null;
    grade?: string | null;
    supervisorName?: string | null;
    supervisorDate?: string | Date | null;
    supervisorSignature?: boolean | string | null;
}

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

    async generatePdf(studentId: number, user?: any): Promise<Buffer> {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                weeklyLogs: { orderBy: { weekNumber: 'asc' } },
                iapReport: true,
                tasks: true,
                ratings: true,
                supervisor: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!student) throw new NotFoundException(`Student with ID ${studentId} not found`);

        return new Promise((resolve) => {
            const doc = new PDFDocument({ margin: 30, size: 'A4' });
            const chunks: Buffer[] = [];

            const fontBold = 'Times-Bold';
            const fontNormal = 'Times-Roman';
            const fontItalic = 'Times-Italic';

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // ─── HELPERS ────────────────────────────────────────────────────────────────
            const drawFormBox = (x: number, y: number, w: number, h: number, label: string, value: string | null | undefined) => {
                doc.lineWidth(0.5).rect(x, y, w, h).stroke();
                doc.font(fontBold).fontSize(7).text(label.toUpperCase(), x + 5, y + 5);
                doc.font(fontNormal).fontSize(10).text(value || '', x + 10, y + 16, { width: w - 15 });
            };

            const drawCheckbox = (x: number, y: number, label: string, checked: boolean) => {
                doc.lineWidth(0.5).rect(x, y, 10, 10).stroke();
                if (checked) {
                    doc.moveTo(x, y).lineTo(x + 10, y + 10).stroke();
                    doc.moveTo(x + 10, y).lineTo(x, y + 10).stroke();
                }
                doc.font(fontNormal).fontSize(9).text(label, x + 15, y + 2);
            };

            // ─── PAGE 1: INFORMATION FORMS ──────────────────────────────────────────────
            doc.lineWidth(1.5).rect(20, 20, 555, 802).stroke();
            doc.font(fontBold).fontSize(22).text('INDUSTRIAL ATTACHMENT', 30, 60, { align: 'center' });
            doc.fontSize(30).text('LOGBOOK', 30, 90, { align: 'center' });
            doc.lineWidth(1).moveTo(150, 130).lineTo(450, 130).stroke();

            let cy = 160;
            doc.font(fontBold).fontSize(11).text('Student details:', 40, cy); cy += 15;
            drawFormBox(40, cy, 515, 35, 'Name of Student', student.fullName); cy += 40;
            drawFormBox(40, cy, 515, 35, 'Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : ''); cy += 40;
            drawFormBox(40, cy, 250, 35, 'ID/Passport No.', student.idOrPassport);
            drawFormBox(305, cy, 250, 35, 'Reg No.', student.studentNumber); cy += 40;
            drawFormBox(40, cy, 515, 35, 'Cell Phone No.', student.phone); cy += 55;

            doc.font(fontBold).text('Company/Institution details:', 40, cy); cy += 15;
            drawFormBox(40, cy, 515, 35, 'Name', student.companyName); cy += 40;
            drawFormBox(40, cy, 515, 35, 'Address/Location', student.companyAddress); cy += 40;
            drawFormBox(40, cy, 160, 35, 'Tel No.', student.companyPhone);
            drawFormBox(210, cy, 200, 35, 'Email', student.companyEmail);
            drawFormBox(420, cy, 135, 35, 'P.O.Box', student.companyPOBox); cy += 55;

            doc.font(fontBold).text('Supervisor details:', 40, cy); cy += 15;
            drawFormBox(40, cy, 515, 35, 'IAP Company Supervisor Name', student.supervisorName); cy += 40;
            drawFormBox(40, cy, 515, 35, 'Designation/Title', student.supervisorDesignation); cy += 40;
            drawFormBox(40, cy, 250, 35, 'Tel No.', student.supervisorPhone);
            drawFormBox(305, cy, 250, 35, 'Email', student.supervisorEmail);

            // ─── PAGE 2: IAP OBJECTIVES ────────────────────────────────────────────────
            doc.addPage();
            doc.font(fontBold).fontSize(14).text('IAP Objectives', 40, 40);
            doc.font(fontNormal).fontSize(11);
            const objectives = [
                'To develop students and enhance their range of skills that are valuable for future careers, including technical skills and transferable skills such as communication, problem-solving, critical thinking, teamwork, adaptability, and time management.',
                'To expose students to the industry they are interested in or studying, allowing them to gain a deeper understanding of industry practices, trends, challenges, and opportunities.',
                'Opportunity for students to build professional networks and establish connections with industry professionals, facilitating future job opportunities, mentorship, and valuable industry contacts.',
                'Students can explore their career interests and clarify their goals by experiencing a real work environment and gaining insights into different roles, industries, and work cultures.',
                'To foster professional growth in students, challenging them, providing new experiences, and offering feedback to develop self-confidence, resilience, adaptability, and a growth mind-set.',
                'To integrate academic learning with practical application, helping students understand how theoretical concepts and classroom learning align with real-world scenarios, enhancing their overall educational experience.'
            ];
            let objY = 60;
            objectives.forEach(text => {
                doc.text(`- ${text}`, 50, objY, { width: 500 });
                objY += doc.heightOfString(text, { width: 500 }) + 10;
            });

            // ─── PAGE 3: KEY POINTS ────────────────────────────────────────────────────
            doc.addPage();
            doc.font(fontBold).text('Key points to keep in mind on a daily basis (Compulsory by the student).', 40, 40);
            doc.text('Before IAP', 40, 70);
            doc.font(fontNormal).text('1. Did you meet your IAP coordinator or any Liaison Officer (LO)?', 50, 85);

            doc.font(fontBold).text('During IAP', 40, 110);
            doc.font(fontNormal).text('2. Did your company supervisor assess you weekly and record on your Log Book?', 50, 125);
            doc.text('3. Did your LO assess your Log Book when you are visited?', 50, 140);

            doc.font(fontBold).text('After IAP', 40, 170);
            doc.font(fontNormal);
            const afterIAP = [
                "4. Did you send a Thank You letter to your IAP Company/Institution and give a copy to your LO with a reception stamp & signature? (Compulsory)",
                "5. Did you complete the Student's Report Form?",
                "6. Did you submit your Log Book plus your IAP-Report to your LO for grading within TWO weeks after the completion of IAP?",
                "7. Did the LO sign your Log Book pages?"
            ];
            let p3Y = 185;
            afterIAP.forEach(text => {
                doc.text(text, 50, p3Y, { width: 500 });
                p3Y += doc.heightOfString(text, { width: 500 }) + 5;
            });

            // ─── PAGES 4-7: GUIDELINES ─────────────────────────────────────────────────
            doc.addPage();
            doc.font(fontBold).text('1. Introduction', 40, 40);
            doc.font(fontNormal).text('Preparing for an IAP is crucial to ensure a successful and enriching experience. This guide presents instructions to students on how to make the most out of their placement, starting from the preparation phase, during the placement itself, and concluding with the post placement phase. Follow these guidelines to maximize your learning, professional growth, and overall experience.', 40, 55, { width: 515 });

            doc.font(fontBold).text('Rules and Regulations', 40, 120);
            const rules = [
                'Once your IAP placement has been confirmed, you are not permitted to change your attachment or withdraw from the program without obtaining approval from the RCA IAP coordinator.',
                'It is mandatory for you to adhere to the rules and regulations that govern employees of the IAP company or institution to which you are attached.',
                'Any instances of absenteeism, insubordination, tardiness, or misconduct reported against you will result in disciplinary action.',
                'Direct negotiation with the company regarding matters such as the duration of your attachment, allowance, working hours, leave of absence, working conditions, and rules is strictly prohibited.'
            ];
            let rY = 135;
            rules.forEach(r => {
                doc.text(`- ${r}`, 50, rY, { width: 500 });
                rY += doc.heightOfString(r, { width: 500 }) + 5;
            });

            // ─── PAGES 9-22: WEEKLY LOGS (WEEKS 1-14) ──────────────────────────────────
            for (let w = 1; w <= 14; w++) {
                const log: WeeklyLogEntry = student.weeklyLogs.find(l => l.weekNumber === w) || {};
                doc.addPage();
                doc.font(fontBold).fontSize(16).text(`Student Log for Industrial Attachment (Week ${w})`, 30, 40, { align: 'center' });
                doc.font(fontNormal).fontSize(10);
                doc.text(`From: ${log.startDate ? new Date(log.startDate).toLocaleDateString() : '__________'}`, 40, 70);
                doc.text(`To: ${log.endDate ? new Date(log.endDate).toLocaleDateString() : '__________'}`, 180, 70);
                doc.text(`Student signature: ____________________`, 380, 70);

                const tableX = 40;
                let tableY = 90;
                const rowH = 40;
                doc.rect(tableX, tableY, 515, 20).fill('#f0f0f0').stroke();
                doc.fillColor('black').font(fontBold).text('Days', tableX + 5, tableY + 5);
                doc.text('Brief description of tasks', tableX + 105, tableY + 5);
                doc.text('Working hours/day', tableX + 415, tableY + 5);
                tableY += 20;

                const days = [
                    ['MON', log.mondayTask, log.mondayHours],
                    ['TUE', log.tuesdayTask, log.tuesdayHours],
                    ['WED', log.wednesdayTask, log.wednesdayHours],
                    ['THU', log.thursdayTask, log.thursdayHours],
                    ['FRI', log.fridayTask, log.fridayHours],
                ];

                days.forEach(([day, task, hours]) => {
                    doc.rect(tableX, tableY, 515, rowH).stroke();
                    doc.rect(tableX, tableY, 100, rowH).stroke();
                    doc.rect(tableX + 410, tableY, 105, rowH).stroke();
                    doc.font(fontBold).text(day as string, tableX + 5, tableY + 15);
                    doc.font(fontNormal).text((task as string) || '', tableX + 105, tableY + 5, { width: 300 });
                    doc.text(String(hours || ''), tableX + 415, tableY + 15, { align: 'center', width: 95 });
                    tableY += rowH;
                });

                tableY += 15;
                doc.font(fontBold).text(`Total hours per week: ${log.totalHours || '______'}`, tableX, tableY);
                tableY += 20;
                doc.text('Student’s General Statement on Attachment:', tableX, tableY);
                doc.rect(tableX, tableY + 12, 515, 50).stroke();
                doc.font(fontNormal).text(log.generalStatement || '', tableX + 10, tableY + 20, { width: 495 });

                tableY += 80;
                doc.font(fontBold).text('Evaluation by Company Supervisor:', tableX, tableY);
                tableY += 15;
                drawCheckbox(tableX + 10, tableY, 'A (Excellent)', log.grade === 'A');
                drawCheckbox(tableX + 110, tableY, 'B (Good)', log.grade === 'B');
                drawCheckbox(tableX + 210, tableY, 'C (Average)', log.grade === 'C');
                drawCheckbox(tableX + 310, tableY, 'D (Pass)', log.grade === 'D');
                drawCheckbox(tableX + 410, tableY, 'E (Fail)', log.grade === 'E');

                tableY += 30;
                doc.text(`Name of Supervisor: ${log.supervisorName || '____________________'}`, tableX, tableY);
                doc.text(`Date: ${log.supervisorDate ? new Date(log.supervisorDate).toLocaleDateString() : '__________'}`, tableX + 350, tableY);
                tableY += 15;
                doc.text(`Signature: ${log.supervisorSignature ? '[DIGITALLY SIGNED]' : '____________________'}`, tableX, tableY);
            }

            // ─── FINAL PAGES ───────────────────────────────────────────────────────────
            doc.addPage();
            doc.font(fontBold).fontSize(14).text('Industrial Attachment Result Report (for students)', 30, 40, { align: 'center' });

            // ─── INDUSTRIAL ATTACHMENT ASSESSMENT (FOR COMPANIES) ──────────────────────
            doc.addPage();
            doc.text('Industrial Attachment Assessment (for Companies)', 30, 40, { align: 'center' });

            doc.addPage();
            doc.addPage();
            doc.text('Student attendance sheet', 30, 40, { align: 'center' });

            doc.addPage();
            doc.fontSize(12).text('Please return the filled Log book and IAP Report to RCA within TWO weeks.', 30, 100, { align: 'center' });

            doc.end();
        });
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
                    startDate: weekStart,
                    endDate: weekEnd,
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
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            select: { studentId: true, weekNumber: true }
        });

        if (!log) throw new NotFoundException('Weekly log not found');

        const status = 'SUBMITTED';

        const updateData: any = { status: status as WeeklyLogStatus };
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

    async approveAllForStudent(studentId: number) {
        const result = await this.prisma.weeklyLog.updateMany({
            where: {
                studentId: studentId,
                status: { not: 'COMPLETED' }
            },
            data: {
                status: 'COMPLETED' as WeeklyLogStatus,
                supervisorSignature: true,
                approvedAt: new Date(),
                supervisorDate: new Date()
            }
        });

        // Optional: Send a single notification to the student
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: { userId: true }
        });

        if (student && result.count > 0) {
            await this.notificationsService.createNotification({
                userId: student.userId,
                title: 'Assigned Logs Approved',
                message: `All your pending weekly logs have been approved following your assessment.`,
                type: 'SUCCESS',
                link: '/student/logbook',
            });
        }

        return result;
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
                status: 'COMPLETED' as WeeklyLogStatus,
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
}