"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// Add user (moved from superteacher)
router.post("/add-user", async (req, res) => {
    try {
        const { email, name, role, password, phone, department } = req.body;
        if (!['SUPERVISOR', 'ADMIN'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be SUPERVISOR or ADMIN' });
        }
        const existingUser = await prisma_js_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hashedPassword = password ? await bcryptjs_1.default.hash(password, 10) : null;
        const user = await prisma_js_1.default.user.create({
            data: {
                email,
                name,
                role,
                password: hashedPassword,
                ...(role === 'SUPERVISOR' && {
                    supervisorProfile: {
                        create: {
                            phone,
                            department,
                        },
                    },
                }),
            },
            include: {
                supervisorProfile: true,
            },
        });
        return res.status(201).json({ message: 'User created successfully', user });
    }
    catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});
// GET supervisors
router.get("/", async (req, res) => {
    try {
        const { limit: limitParam, offset: offsetParam } = req.query;
        const limit = Math.min(parseInt(limitParam || "50"), 100);
        const offset = parseInt(offsetParam || "0");
        const supervisors = await prisma_js_1.default.supervisor.findMany({
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return res.json({ supervisors });
    }
    catch (error) {
        console.error("Error fetching supervisors:", error);
        return res.status(500).json({ error: "Failed to fetch supervisors", details: error.message });
    }
});
exports.default = router;
