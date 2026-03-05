import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IapReportsService {
    constructor(private prisma: PrismaService) { }

    async findByStudent(studentId: number) {
        const report = await this.prisma.iapReport.findUnique({
            where: { studentId },
        });
        return report;
    }

    async upsert(data: any) {
        const { studentId, ...rest } = data;
        const sId = Number(studentId);

        if (!sId) throw new BadRequestException('studentId is required');

        return this.prisma.iapReport.upsert({
            where: { studentId: sId },
            create: {
                studentId: sId,
                ...rest,
            },
            update: {
                ...rest,
            },
        });
    }
}
