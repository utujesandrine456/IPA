import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async findAll(studentId?: number, supervisorId?: number) {
        if (supervisorId) {
            const students = await this.prisma.student.findMany({
                where: { supervisorId },
                select: { id: true },
            });
            const studentIds = students.map((s: any) => s.id);
            const tasks = await this.prisma.task.findMany({
                where: { studentId: { in: studentIds } },
                include: {
                    student: { include: { user: true } },
                    comments: { orderBy: { createdAt: 'desc' } },
                },
                orderBy: { date: 'desc' },
            });
            return { tasks };
        }

        if (!studentId) {
            throw new BadRequestException('studentId or supervisorId is required');
        }

        const tasks = await this.prisma.task.findMany({
            where: { studentId },
            include: {
                comments: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { date: 'desc' },
        });
        return { tasks };
    }

    async create(data: any) {
        const { studentId, title, description, date } = data;
        const studentIdNumber = Number(studentId);
        if (!studentIdNumber || !title) {
            throw new BadRequestException('studentId and title are required');
        }

        const task = await this.prisma.task.create({
            data: {
                studentId: studentIdNumber,
                title,
                description,
                date: date ? new Date(date) : new Date(),
                status: 'PENDING',
            },
            include: {
                student: { include: { user: true } },
            },
        });

        if (task.student?.user?.id) {
            await this.prisma.notification.create({
                data: {
                    userId: task.student.user.id,
                    title: "New Task Assigned",
                    message: `You have been assigned a new task: "${title}"`,
                    type: "TASK",
                    link: `/student/${studentIdNumber}`
                }
            });
        }

        return { message: 'Task created successfully', task };
    }

    async update(body: any) {
        const { taskId, status, description, submissionContent, attachments, rating, comment, supervisorId, title, date } = body;
        const taskIdNumber = Number(taskId);
        if (!taskIdNumber) {
            throw new BadRequestException('taskId is required');
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (status) {
            updateData.status = status;
        }

        if (title) {
            updateData.title = title;
        }

        if (date) {
            updateData.date = new Date(date);
        }

        if (description) {
            updateData.description = description + (attachments ? `\n\nAttachments: ${attachments}` : '');
        }

        if (submissionContent !== undefined) {
            updateData.submissionContent = submissionContent;
        }

        if (status === 'COMPLETED' || status === 'APPROVED') {
            updateData.completedAt = new Date();
        }

        if (status === 'SUBMITTED') {
            updateData.submittedAt = new Date();
        }

        const task = await this.prisma.task.update({
            where: { id: taskIdNumber },
            data: updateData,
            include: {
                student: {
                    include: {
                        user: true,
                        supervisor: { include: { user: true } }
                    },
                },
                comments: true,
            },
        });

        // Notifications
        if (status === 'SUBMITTED' && task.student?.supervisor?.user?.id) {
            await this.prisma.notification.create({
                data: {
                    userId: task.student.supervisor.user.id,
                    title: "Task Submitted",
                    message: `${task.student.user.name} has submitted work for "${task.title}"`,
                    type: "TASK",
                    link: `/supervisor/${task.student.supervisor.id}`
                }
            });
        } else if (status === 'IN_PROGRESS' && task.student?.supervisor?.user?.id) {
            // Optional progress notification
            await this.prisma.notification.create({
                data: {
                    userId: task.student.supervisor.user.id,
                    title: "Task in Progress",
                    message: `${task.student.user.name} started working on "${task.title}"`,
                    type: "TASK",
                    link: `/supervisor/${task.student.supervisor.id}`
                }
            });
        } else if ((status === 'COMPLETED' || status === 'PENDING') && task.student?.user?.id) {
            const notifType = status === 'COMPLETED' ? 'SUCCESS' : 'WARNING';
            const notifTitle = status === 'COMPLETED' ? 'Task Approved' : 'Task Revision Requested';
            const notifMessage = status === 'COMPLETED'
                ? `Your work for "${task.title}" has been approved!`
                : `Your work for "${task.title}" needs revision.`;

            await this.prisma.notification.create({
                data: {
                    userId: task.student.user.id,
                    title: notifTitle,
                    message: notifMessage,
                    type: notifType,
                    link: `/student/${task.student.id}`
                }
            });
        }

        if (rating || comment) {
            await this.prisma.comment.create({
                data: {
                    taskId: taskIdNumber,
                    content: `Rating: ${rating}/10${comment ? `\n\nFeedback: ${comment}` : ''}`,
                    supervisorId: supervisorId || null,
                },
            });
        }

        return { message: 'Task updated successfully', task };
    }

    async remove(taskId: number) {
        if (!taskId) {
            throw new BadRequestException('taskId is required');
        }
        // Delete any related comments first to avoid FK constraint errors
        await this.prisma.comment.deleteMany({ where: { taskId } });
        await this.prisma.task.delete({ where: { id: taskId } });
        return { message: 'Task deleted successfully' };
    }
}
