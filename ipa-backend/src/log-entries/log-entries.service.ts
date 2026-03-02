import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogEntriesService {
    constructor(private prisma: PrismaService) { }

    async findByStudent(studentId: number) {
        if (!studentId) throw new BadRequestException('studentId is required');
        const logs = await this.prisma.logEntry.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
        });
        return { logs };
    }

    async create(data: { studentId: number | string; content: string }) {
        const studentId = Number(data.studentId);
        if (!studentId || !data.content) {
            throw new BadRequestException('studentId and content are required');
        }
        const log = await this.prisma.logEntry.create({
            data: {
                studentId,
                content: data.content,
                date: new Date(),
            },
        });
        return { message: 'Log entry created', log };
    }

    async delete(id: number) {
        return this.prisma.logEntry.delete({ where: { id } });
    }
}
