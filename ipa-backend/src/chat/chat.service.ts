import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getMessages(userId: number, otherUserId: number) {
        if (!userId || !otherUserId) {
            throw new BadRequestException('userId and otherUserId are required');
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

    async sendMessage(data: { senderId: number; receiverId: number; content?: string; fileUrl?: string; fileName?: string }) {
        const { senderId, receiverId, content, fileUrl, fileName } = data;
        if (!senderId || !receiverId || (!content && !fileUrl)) {
            throw new BadRequestException('senderId, receiverId and either content or a file are required');
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

    async getPeers(studentId: number) {
        if (!studentId) throw new BadRequestException('studentId is required');
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: { supervisorId: true },
        });
        if (!student) throw new BadRequestException('Student not found');

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

    async getUnreadCount(userId: number) {
        const count = await this.prisma.message.count({
            where: { receiverId: userId, read: false },
        });
        return { count };
    }
}
