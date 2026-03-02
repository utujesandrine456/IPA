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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMessages(userId, otherUserId) {
        if (!userId || !otherUserId) {
            throw new common_1.BadRequestException('userId and otherUserId are required');
        }
        const messages = await this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
            include: {
                sender: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        // Mark received messages as read
        await this.prisma.message.updateMany({
            where: {
                receiverId: userId,
                senderId: otherUserId,
                read: false,
            },
            data: { read: true },
        });
        return { messages };
    }
    async sendMessage(data) {
        const { senderId, receiverId, content, fileUrl, fileName } = data;
        if (!senderId || !receiverId || (!content && !fileUrl)) {
            throw new common_1.BadRequestException('senderId, receiverId and either content or a file are required');
        }
        const message = await this.prisma.message.create({
            data: {
                senderId: Number(senderId),
                receiverId: Number(receiverId),
                content: content || '',
            },
            include: {
                sender: { select: { id: true, name: true } },
            },
        });
        return { message };
    }
    async getPeers(studentId) {
        if (!studentId)
            throw new common_1.BadRequestException('studentId is required');
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: { supervisorId: true },
        });
        if (!student)
            throw new common_1.BadRequestException('Student not found');
        // Find peers (fellow students)
        const peers = await this.prisma.student.findMany({
            where: {
                supervisorId: student.supervisorId,
                id: { not: studentId },
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        // Find supervisor info
        const supervisor = await this.prisma.supervisor.findUnique({
            where: { id: student.supervisorId },
            include: { user: { select: { id: true, name: true, email: true } } }
        });
        return {
            peers,
            supervisor: supervisor ? {
                id: supervisor.id,
                user: supervisor.user
            } : null
        };
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.message.count({
            where: { receiverId: userId, read: false },
        });
        return { count };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
