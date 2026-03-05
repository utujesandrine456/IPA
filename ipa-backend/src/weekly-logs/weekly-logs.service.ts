import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WeeklyLogsService {
    constructor(private prisma: PrismaService) { }

    async findByStudent(studentId: number) {
        if (!studentId) throw new BadRequestException('studentId is required');
        const logs = await this.prisma.weeklyLog.findMany({
            where: { studentId },
            orderBy: { weekNumber: 'asc' },
        });
        return { logs };
    }

    async upsert(data: any) {
        const { studentId, weekNumber, ...rest } = data;
        const sId = Number(studentId);
        const wNum = Number(weekNumber);

        if (!sId || !wNum) {
            throw new BadRequestException('studentId and weekNumber are required');
        }

        // Convert dates if present
        if (rest.startDate) rest.startDate = new Date(rest.startDate);
        if (rest.endDate) rest.endDate = new Date(rest.endDate);
        if (rest.dateSigned) rest.dateSigned = new Date(rest.dateSigned);

        const existing = await this.prisma.weeklyLog.findFirst({
            where: { studentId: sId, weekNumber: wNum },
        });

        if (existing) {
            return this.prisma.weeklyLog.update({
                where: { id: existing.id },
                data: { ...rest },
            });
        }

        return this.prisma.weeklyLog.create({
            data: {
                studentId: sId,
                weekNumber: wNum,
                ...rest,
            },
        });
    }
}
