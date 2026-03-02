"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId)
            return res.status(400).json({ error: "User ID required" });
        const notifications = await prisma_js_1.default.notification.findMany({
            where: { userId: Number(userId) },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ notifications });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// PATCH notifications (mark as read)
router.patch("/", async (req, res) => {
    try {
        const { id, read, userId } = req.body;
        if (id) {
            await prisma_js_1.default.notification.update({
                where: { id: Number(id) },
                data: { read: !!read },
            });
        }
        else if (userId) {
            await prisma_js_1.default.notification.updateMany({
                where: { userId: Number(userId), read: false },
                data: { read: true },
            });
        }
        return res.json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// DELETE notifications
router.delete("/", async (req, res) => {
    try {
        const { id, userId } = req.query;
        if (id) {
            await prisma_js_1.default.notification.delete({ where: { id: Number(id) } });
        }
        else if (userId) {
            await prisma_js_1.default.notification.deleteMany({ where: { userId: Number(userId) } });
        }
        return res.json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
