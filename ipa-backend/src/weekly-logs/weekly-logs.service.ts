import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WeeklyLogStatus } from '@prisma/client';

@Injectable()
export class WeeklyLogsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async findByStudent(studentId: number) {
        return this.prisma.weeklyLog.findMany({
            where: { studentId },
            include: { dailyEntries: true },
            orderBy: { weekNumber: 'desc' },
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
        // Logic to determine week number based on internship start date or current date
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) throw new NotFoundException('Student not found');

        const startDate = student.internshipStart || new Date(date.getFullYear(), 0, 1);
        const diffInMs = date.getTime() - startDate.getTime();
        const weekNumber = Math.max(1, Math.ceil(diffInMs / (1000 * 60 * 60 * 24 * 7)));

        // Find the Monday and Sunday of that week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
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
                    weekStart,
                    weekEnd,
                    status: WeeklyLogStatus.DRAFT,
                },
            });
        }

        return weeklyLog;
    }

    async submitWeek(id: number, data: { summary: string; objectives: string }) {
        const weeklyLog = await this.prisma.weeklyLog.update({
            where: { id },
            data: {
                summary: data.summary,
                objectives: data.objectives,
                status: WeeklyLogStatus.SUBMITTED,
            },
            include: { student: { include: { supervisor: true } } },
        });

        // Notify supervisor
        if (weeklyLog.student.supervisor?.userId) {
            await this.notificationsService.createNotification({
                userId: weeklyLog.student.supervisor.userId,
                title: 'Weekly Log Submitted',
                message: `${weeklyLog.student.fullName} has submitted their Weekly Log for Week ${weeklyLog.weekNumber}.`,
                type: 'INFO',
                link: `/supervisor/students/${weeklyLog.studentId}/logbook`,
            });
        }

        return weeklyLog;
    }

    async approveWeek(id: number, supervisorUserId: number, note?: string) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: { student: { include: { supervisor: true } } },
        });

        if (!log) throw new NotFoundException('Weekly log not found');
        if (log.student.supervisor.userId !== supervisorUserId) {
            throw new ForbiddenException('You are not authorized to approve this log');
        }

        const updatedLog = await this.prisma.weeklyLog.update({
            where: { id },
            data: {
                status: WeeklyLogStatus.APPROVED,
                supervisorNote: note,
                approvedAt: new Date(),
            },
        });

        // Notify student
        await this.notificationsService.createNotification({
            userId: log.student.userId,
            title: 'Weekly Log Approved',
            message: `Your Weekly Log for Week ${log.weekNumber} has been approved.`,
            type: 'SUCCESS',
            link: '/student/logbook',
        });

        return updatedLog;
    }

    async rejectWeek(id: number, supervisorUserId: number, note: string) {
        const log = await this.prisma.weeklyLog.findUnique({
            where: { id },
            include: { student: { include: { supervisor: true } } },
        });

        if (!log) throw new NotFoundException('Weekly log not found');
        if (log.student.supervisor.userId !== supervisorUserId) {
            throw new ForbiddenException('You are not authorized to reject this log');
        }

        const updatedLog = await this.prisma.weeklyLog.update({
            where: { id },
            data: {
                status: WeeklyLogStatus.REJECTED,
                supervisorNote: note,
            },
        });

        // Notify student
        await this.notificationsService.createNotification({
            userId: log.student.userId,
            title: 'Weekly Log Revision Requested',
            message: `Supervisor requested revision for Week ${log.weekNumber}: ${note}`,
            type: 'WARNING',
            link: '/student/logbook',
        });

        return updatedLog;
    }
}
