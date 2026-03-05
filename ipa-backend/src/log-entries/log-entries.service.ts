import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyLogsService } from '../weekly-logs/weekly-logs.service';

@Injectable()
export class LogEntriesService {
    constructor(
        private prisma: PrismaService,
        private weeklyLogsService: WeeklyLogsService,
    ) { }

    async findByStudent(studentId: number) {
        if (!studentId) throw new BadRequestException('studentId is required');
        const logs = await this.prisma.logEntry.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
        });
        return { logs };
    }

    async create(data: {
        studentId: number | string;
        content: string;
        date?: string;
        mood?: string;
        weeklyLogId?: number;
    }) {
        const studentId = Number(data.studentId);
        if (!studentId || !data.content) {
            throw new BadRequestException('studentId and content are required');
        }

        const logDate = data.date ? new Date(data.date) : new Date();

        // Ensure we have a weekly log linked
        let weeklyLogId = data.weeklyLogId;
        if (!weeklyLogId) {
            const week = await this.weeklyLogsService.findOrCreateWeek(studentId, logDate);
            weeklyLogId = week.id;
        }

        const log = await this.prisma.logEntry.create({
            data: {
                studentId,
                content: data.content,
                date: logDate,
                mood: data.mood,
                weeklyLogId: weeklyLogId,
            },
        });
        return { message: 'Log entry created', log };
    }

    async update(id: number, data: { content?: string; mood?: string }) {
        return this.prisma.logEntry.update({
            where: { id },
            data,
        });
    }

    async delete(id: number) {
        return this.prisma.logEntry.delete({ where: { id } });
    }
}
