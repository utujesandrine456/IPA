"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const router = (0, express_1.Router)();
// GET ratings
router.get("/", async (req, res) => {
    try {
        const { studentId, supervisorId } = req.query;
        if (studentId) {
            const ratings = await prisma_js_1.default.rating.findMany({
                where: { studentId: Number(studentId) },
                include: { supervisor: { include: { user: true } } },
                orderBy: { createdAt: 'desc' },
            });
            return res.json({ ratings });
        }
        if (supervisorId) {
            const ratings = await prisma_js_1.default.rating.findMany({
                where: { supervisorId: Number(supervisorId) },
                include: { student: { include: { user: true } } },
                orderBy: { createdAt: 'desc' },
            });
            return res.json({ ratings });
        }
        return res.status(400).json({ error: 'studentId or supervisorId is required' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// POST/PUT ratings
router.post("/", async (req, res) => {
    try {
        const { studentId, supervisorId, rating, comment } = req.body;
        if (!studentId || !supervisorId || !rating) {
            return res.status(400).json({ error: 'studentId, supervisorId, and rating are required' });
        }
        const rat = Number(rating);
        if (rat < 1 || rat > 10) {
            return res.status(400).json({ error: 'Rating must be between 1 and 10' });
        }
        const sid = Number(studentId);
        const suid = Number(supervisorId);
        const existingRating = await prisma_js_1.default.rating.findFirst({
            where: { studentId: sid, supervisorId: suid },
        });
        let result;
        if (existingRating) {
            result = await prisma_js_1.default.rating.update({
                where: { id: existingRating.id },
                data: { rating: rat, comment },
                include: { student: { include: { user: true } }, supervisor: { include: { user: true } } },
            });
        }
        else {
            result = await prisma_js_1.default.rating.create({
                data: { studentId: sid, supervisorId: suid, rating: rat, comment },
                include: { student: { include: { user: true } }, supervisor: { include: { user: true } } },
            });
        }
        return res.status(201).json({ message: 'Rating saved successfully', rating: result });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
