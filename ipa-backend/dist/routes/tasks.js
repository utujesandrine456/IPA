"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const router = (0, express_1.Router)();
// GET tasks
router.get("/", async (req, res) => {
    try {
        const { studentId, supervisorId } = req.query;
        if (supervisorId) {
            const students = await prisma_js_1.default.student.findMany({
                where: { supervisorId: Number(supervisorId) },
                select: { id: true },
            });
            const studentIds = students.map((s) => s.id);
            const tasks = await prisma_js_1.default.task.findMany({
                where: {
                    studentId: { in: studentIds },
                },
                include: {
                    student: {
                        include: {
                            user: true,
                        },
                    },
                    comments: {
                        include: {
                            task: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
                orderBy: {
                    date: "desc",
                },
            });
            return res.json({ tasks });
        }
        if (!studentId) {
            return res.status(400).json({ error: "studentId or supervisorId is required" });
        }
        const tasks = await prisma_js_1.default.task.findMany({
            where: { studentId: Number(studentId) },
            include: {
                comments: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });
        return res.json({ tasks });
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).json({ error: "Failed to fetch tasks", details: error.message });
    }
});
// POST task
router.post("/", async (req, res) => {
    try {
        const { studentId, title, description, date } = req.body;
        const studentIdNumber = Number(studentId);
        if (!studentIdNumber || !title) {
            return res.status(400).json({ error: "studentId and title are required" });
        }
        const task = await prisma_js_1.default.task.create({
            data: {
                studentId: studentIdNumber,
                title,
                description,
                date: date ? new Date(date) : new Date(),
                status: "PENDING",
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (task.student?.user?.id) {
            await prisma_js_1.default.notification.create({
                data: {
                    userId: task.student.user.id,
                    title: "New Task Assigned",
                    message: `You have been assigned a new task: "${title}"`,
                    type: "TASK",
                    link: `/student/${studentIdNumber}`
                }
            });
        }
        return res.status(201).json({ message: "Task created successfully", task });
    }
    catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).json({ error: "Failed to create task", details: error.message });
    }
});
// PATCH task
router.patch("/", async (req, res) => {
    try {
        const { taskId, status, description, attachments, rating, comment, supervisorId } = req.body;
        const taskIdNumber = Number(taskId);
        if (!taskIdNumber || !status) {
            return res.status(400).json({ error: "taskId and status are required" });
        }
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (description) {
            updateData.description = description + (attachments ? `\n\nAttachments: ${attachments}` : "");
        }
        if (status === "COMPLETED") {
            updateData.completedAt = new Date();
        }
        if (status === "IN_PROGRESS") {
            updateData.submittedAt = new Date();
        }
        const task = await prisma_js_1.default.task.update({
            where: { id: taskIdNumber },
            data: updateData,
            include: {
                student: {
                    include: {
                        user: true,
                        supervisor: {
                            include: {
                                user: true
                            }
                        }
                    },
                },
                comments: true,
            },
        });
        // Notifications
        if (status === "IN_PROGRESS" && task.student?.supervisor?.user?.id) {
            await prisma_js_1.default.notification.create({
                data: {
                    userId: task.student.supervisor.user.id,
                    title: "Task Submission",
                    message: `${task.student.user.name} has submitted work for "${task.title}"`,
                    type: "TASK",
                    link: `/supervisor/${task.student.supervisor.id}?tab=tasks`
                }
            });
        }
        else if ((status === "COMPLETED" || status === "PENDING") && task.student?.user?.id) {
            const notifType = status === "COMPLETED" ? "SUCCESS" : "WARNING";
            const notifTitle = status === "COMPLETED" ? "Task Approved" : "Task Revision Requested";
            const notifMessage = status === "COMPLETED"
                ? `Your work for "${task.title}" has been approved!`
                : `Your work for "${task.title}" needs revision.`;
            await prisma_js_1.default.notification.create({
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
            await prisma_js_1.default.comment.create({
                data: {
                    taskId: taskIdNumber,
                    content: `Rating: ${rating}/10${comment ? `\n\nFeedback: ${comment}` : ""}`,
                    supervisorId: supervisorId || null,
                },
            });
        }
        return res.json({ message: "Task updated successfully", task });
    }
    catch (error) {
        console.error("Error updating task:", error);
        return res.status(500).json({ error: "Failed to update task", details: error.message });
    }
});
exports.default = router;
