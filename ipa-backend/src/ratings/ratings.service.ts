import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeeklyLogsService } from '../weekly-logs/weekly-logs.service';

@Injectable()
export class RatingsService {
    constructor(
        private prisma: PrismaService,
        private weeklyLogsService: WeeklyLogsService
    ) { }

    async create(data: {
        studentId: number;
        supervisorId: number;
        rating: number;
        comment?: string;
        knowledgeWirelessOps?: number;
        knowledgeWirelessEst?: number;
        knowledgeWirelessMaint?: number;
        knowledgeApplication?: number;
        responsibility?: number;
        cooperativeness?: number;
        complianceEtiquette?: number;
        safetyAwareness?: number;
        safetyCompliance?: number;
        safetyArrangement?: number;
        evaluatorPosition?: string;
        evaluatorName?: string;
    }) {
        const { studentId, supervisorId, rating, comment, ...scores } = data;

        if (!studentId || !supervisorId || rating === undefined) {
            throw new BadRequestException('studentId, supervisorId and rating are required');
        }

        const ratingData = {
            studentId: Number(studentId),
            supervisorId: Number(supervisorId),
            rating: Number(rating),
            comment,
            ...scores
        };

        const result = await this.prisma.rating.upsert({
            where: { studentId: Number(studentId) },
            update: ratingData,
            create: ratingData
        });

        // After rating, auto-approve all weekly logs
        await this.weeklyLogsService.approveAllForStudent(Number(studentId));

        return result;
    }

    async findByStudent(studentId: number) {
        return this.prisma.rating.findMany({
            where: { studentId: Number(studentId) },
            include: {
                supervisor: {
                    include: { user: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
