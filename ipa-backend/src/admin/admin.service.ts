import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';


@Injectable()
export class AdminService {
    // Admin service for managing users and activity
    constructor(private prisma: PrismaService) { }

    async getUsers() {
        const users = await this.prisma.user.findMany({
            include: {
                studentProfile: true,
                supervisorProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return { users };
    }

    async getActivity() {
        const recentTasks = await this.prisma.task.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { student: { include: { user: true } } },
        });

        const recentRatings = await this.prisma.rating.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: { include: { user: true } },
                supervisor: { include: { user: true } },
            },
        });

        const activities = [
            ...recentTasks.map((task: any) => ({
                type: 'TASK_SUBMISSION',
                id: task.id,
                title: task.title,
                description: task.description,
                user: task.student.user.name,
                date: task.createdAt,
                status: task.status,
            })),
            ...recentRatings.map((rating: any) => ({
                type: 'RATING',
                id: rating.id,
                title: `Rated ${rating.rating}/10`,
                description: rating.comment,
                user: rating.supervisor.user.name,
                target: rating.student.user.name,
                date: rating.createdAt,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);

        return { activities };
    }

    async deleteUser(id: number) {
        if (!id) {
            throw new BadRequestException('User ID required');
        }
        await this.prisma.user.delete({ where: { id } });
        return { success: true };
    }

    async addUser(data: any) {
        const { email, name, role, password, phone, department } = data;

        if (!email || !name || !role) {
            throw new BadRequestException('Email, name, and role are required');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                name,
                role,
                password: hashedPassword,
                isActive: true,
                ...(role === 'SUPERVISOR' ? {
                    supervisorProfile: {
                        create: {
                            phone,
                            department,
                        },
                    },
                } : {}),
            },
        });

        return user;
    }

    async toggleActivation(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id: Number(id) } });
        if (!user) throw new BadRequestException('User not found');

        return this.prisma.user.update({
            where: { id: Number(id) },
            data: { isActive: !user.isActive },
        });
    }
}
