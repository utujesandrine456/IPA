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

        // Clean data: only include fields that exist in the Prisma model
        // and omit fields that should not be updated directly
        const cleanData = {
            nameOfUnit: rest.nameOfUnit,
            overviewGoals: rest.overviewGoals,
            contentsTraining: rest.contentsTraining,
            loVisitCount: rest.loVisitCount,
            isUseful: rest.isUseful,
            improvedUnderstanding: rest.improvedUnderstanding,
            providedExperiences: rest.providedExperiences,
            programmeTypes: rest.programmeTypes,
            otherProgrammeDetails: rest.otherProgrammeDetails,
            futureCareerPlan: rest.futureCareerPlan,
            notableAchievements: rest.notableAchievements,
            satisfactionIndustry: rest.satisfactionIndustry,
            satisfactionInstructors: rest.satisfactionInstructors,
            satisfactionMajor: rest.satisfactionMajor,
            satisfactionPractical: rest.satisfactionPractical,
            suggestions: rest.suggestions,
        };

        return this.prisma.iapReport.upsert({
            where: { studentId: sId },
            create: {
                studentId: sId,
                ...cleanData,
            },
            update: {
                ...cleanData,
            },
        });
    }
}
