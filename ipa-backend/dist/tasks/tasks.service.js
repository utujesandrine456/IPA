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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TasksService = class TasksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(studentId, supervisorId) {
        if (supervisorId) {
            const students = await this.prisma.student.findMany({
                where: { supervisorId },
                select: { id: true },
            });
            const studentIds = students.map((s) => s.id);
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
            throw new common_1.BadRequestException('studentId or supervisorId is required');
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
    async create(data) {
        const { studentId, title, description, date } = data;
        const studentIdNumber = Number(studentId);
        if (!studentIdNumber || !title) {
            throw new common_1.BadRequestException('studentId and title are required');
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
    async update(body) {
        const { taskId, status, description, submissionContent, attachments, rating, comment, supervisorId } = body;
        const taskIdNumber = Number(taskId);
        if (!taskIdNumber || !status) {
            throw new common_1.BadRequestException('taskId and status are required');
        }
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (description) {
            updateData.description = description + (attachments ? `\n\nAttachments: ${attachments}` : '');
        }
        if (submissionContent !== undefined) {
            updateData.submissionContent = submissionContent;
        }
        if (status === 'COMPLETED' || status === 'APPROVED') {
            updateData.completedAt = new Date();
        }
        if (status === 'IN_PROGRESS' || status === 'SUBMITTED') {
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
        if (status === 'IN_PROGRESS' && task.student?.supervisor?.user?.id) {
            await this.prisma.notification.create({
                data: {
                    userId: task.student.supervisor.user.id,
                    title: "Task Submission",
                    message: `${task.student.user.name} has submitted work for "${task.title}"`,
                    type: "TASK",
                    link: `/supervisor/${task.student.supervisor.id}?tab=tasks`
                }
            });
        }
        else if ((status === 'COMPLETED' || status === 'PENDING') && task.student?.user?.id) {
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
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
