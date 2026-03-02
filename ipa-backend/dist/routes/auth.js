"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const { sign } = jsonwebtoken_1.default;
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await prisma_js_1.default.user.findUnique({
            where: { email },
            include: {
                studentProfile: true,
                supervisorProfile: true,
            },
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        if (!user.password) {
            return res.status(403).json({
                error: "Account not activated. Please check your email for the activation link."
            });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            profileCompleted: false,
        };
        if (user.role === "STUDENT" && user.studentProfile) {
            userResponse.profileCompleted = user.studentProfile.profileCompleted;
        }
        return res.json({
            message: "Login successful",
            user: userResponse,
            token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "An error occurred during login" });
    }
});
exports.default = router;
