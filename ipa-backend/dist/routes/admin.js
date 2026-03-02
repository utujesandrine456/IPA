"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const router = (0, express_1.Router)();
router.get("/users", async (req, res) => {
    try {
        const users = await prisma_js_1.default.user.findMany({
            include: {
                studentProfile: true,
                supervisorProfile: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.json({ users });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: error.message });
    }
});
// GET admin activity
router.get("/activity", async (req, res) => {
    try {
        const recentTasks = await prisma_js_1.default.task.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: { user: true }
                }
            }
        });
        const recentRatings = await prisma_js_1.default.rating.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: { user: true }
                },
                supervisor: {
                    include: { user: true }
                }
            }
        });
        const activities = [
            ...recentTasks.map((task) => ({
                type: 'TASK_SUBMISSION',
                id: task.id,
                title: task.title,
                description: task.description,
                user: task.student.user.name,
                date: task.createdAt,
                status: task.status
            })),
            ...recentRatings.map((rating) => ({
                type: 'RATING',
                id: rating.id,
                title: `Rated ${rating.rating}/10`,
                description: rating.comment,
                user: rating.supervisor.user.name,
                target: rating.student.user.name,
                date: rating.createdAt
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);
        return res.json({ activities });
    }
    catch (error) {
        console.error('Error fetching admin activity:', error);
        return res.status(500).json({ error: 'Failed to fetch activity', details: error.message });
    }
});
// DELETE user (admin only)
router.delete("/users", async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: "User ID required" });
        }
        await prisma_js_1.default.user.delete({
            where: { id: Number(id) },
        });
        return res.json({ success: true });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
