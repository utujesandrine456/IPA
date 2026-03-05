"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogEntriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const weekly_logs_service_1 = require("../weekly-logs/weekly-logs.service");
let LogEntriesService = class LogEntriesService {
    constructor(prisma, weeklyLogsService) {
        this.prisma = prisma;
        this.weeklyLogsService = weeklyLogsService;
    }
    async findByStudent(studentId) {
        if (!studentId)
            throw new common_1.BadRequestException('studentId is required');
        const logs = await this.prisma.logEntry.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
        });
        return { logs };
    }
    async create(data) {
        const studentId = Number(data.studentId);
        if (!studentId || !data.content) {
            throw new common_1.BadRequestException('studentId and content are required');
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
    async update(id, data) {
        return this.prisma.logEntry.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return this.prisma.logEntry.delete({ where: { id } });
    }
};
exports.LogEntriesService = LogEntriesService;
exports.LogEntriesService = LogEntriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        weekly_logs_service_1.WeeklyLogsService])
], LogEntriesService);
