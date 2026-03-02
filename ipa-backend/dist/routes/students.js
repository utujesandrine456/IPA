"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const utils_js_1 = require("../lib/utils.js");
const email_js_1 = require("../lib/email.js");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// GET students (all or by id or by supervisorId)
router.get("/", async (req, res) => {
    try {
        const { id, supervisorId, limit: limitParam, offset: offsetParam } = req.query;
        if (id) {
            const studentId = Number(id);
            if (Number.isNaN(studentId)) {
                return res.status(400).json({ error: "Invalid student id" });
            }
            const student = await prisma_js_1.default.student.findUnique({
                where: { id: studentId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    supervisor: {
                        include: {
                            user: true
                        }
                    }
                },
            });
            if (!student) {
                return res.status(404).json({ error: "Student not found" });
            }
            return res.json({ student });
        }
        const limit = Math.min(parseInt(limitParam || "50"), 100);
        const offset = parseInt(offsetParam || "0");
        const whereClause = supervisorId ? { supervisorId: Number(supervisorId) } : {};
        const students = await prisma_js_1.default.student.findMany({
            where: whereClause,
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
                supervisor: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.json({ students });
    }
    catch (error) {
        console.error("Error fetching students:", error);
        return res.status(500).json({ error: "Failed to fetch students", details: error.message });
    }
});
// PATCH update student profile
router.patch("/update", async (req, res) => {
    try {
        const { studentId, phone, address, companyName, companyAddress, supervisorName, supervisorEmail, supervisorId } = req.body;
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }
        const updateData = {
            phone,
            address,
            companyName,
            companyAddress,
            supervisorName,
            supervisorEmail,
            profileCompleted: true,
        };
        if (supervisorId) {
            updateData.supervisorId = Number(supervisorId);
        }
        const updatedStudent = await prisma_js_1.default.student.update({
            where: { id: Number(studentId) },
            data: updateData,
        });
        return res.json({ message: 'Profile updated successfully', student: updatedStudent });
    }
    catch (error) {
        console.error('Error updating student profile:', error);
        return res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});
// GET complete-profile by token
router.get("/complete-profile", async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }
        const student = await prisma_js_1.default.student.findUnique({
            where: { profileToken: String(token) },
            include: {
                user: true,
                supervisor: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!student) {
            return res.status(404).json({ error: "Invalid or expired token" });
        }
        if (student.profileCompleted) {
            return res.status(400).json({ error: "Profile already completed" });
        }
        return res.json({ student });
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ error: "Failed to fetch profile", details: error.message });
    }
});
// POST complete-profile
router.post("/complete-profile", async (req, res) => {
    try {
        const { token, password, phone, address, companyName, companyAddress, companyPhone, companyEmail, supervisorName, supervisorEmail, internshipStart, internshipEnd, supervisorId, } = req.body;
        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }
        const student = await prisma_js_1.default.student.findUnique({
            where: { profileToken: token },
            include: { user: true },
        });
        if (!student) {
            return res.status(404).json({ error: "Invalid or expired token" });
        }
        if (student.profileCompleted) {
            return res.status(400).json({ error: "Profile already completed" });
        }
        let targetSupervisorId = student.supervisorId || 0;
        if (supervisorId) {
            const supervisorExists = await prisma_js_1.default.supervisor.findUnique({
                where: { id: Number(supervisorId) },
            });
            if (!supervisorExists) {
                return res.status(400).json({ error: "Invalid supervisor ID" });
            }
            targetSupervisorId = Number(supervisorId);
        }
        let hashedPassword = student.user.password;
        if (password) {
            hashedPassword = await bcryptjs_1.default.hash(password, 10);
        }
        await prisma_js_1.default.user.update({
            where: { id: student.userId },
            data: { password: hashedPassword },
        });
        const updatedStudent = await prisma_js_1.default.student.update({
            where: { id: student.id },
            data: {
                phone,
                address,
                companyName,
                companyAddress,
                companyPhone,
                companyEmail,
                supervisorName,
                supervisorEmail,
                internshipStart: internshipStart ? new Date(internshipStart) : null,
                internshipEnd: internshipEnd ? new Date(internshipEnd) : null,
                supervisorId: targetSupervisorId > 0 ? targetSupervisorId : undefined,
                profileCompleted: true,
                profileToken: null,
            },
            include: {
                user: true,
                supervisor: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        return res.json({
            message: "Profile completed and verified successfully",
            student: updatedStudent,
        });
    }
    catch (error) {
        console.error("Error completing profile:", error);
        return res.status(500).json({ error: "Failed to complete profile", details: error.message });
    }
});
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: 0, errors: [{ row: 0, error: "No file uploaded" }] });
        }
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const normalizeKey = (key) => key.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
        const extractValue = (normalizedRow, aliases) => {
            for (const alias of aliases) {
                const value = normalizedRow[normalizeKey(alias)];
                if (value !== undefined &&
                    value !== null &&
                    String(value).trim() !== "") {
                    return String(value).trim();
                }
            }
            return undefined;
        };
        const errors = [];
        let successCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const normalizedRow = Object.entries(row).reduce((acc, [key, value]) => {
                if (typeof key === "string") {
                    acc[normalizeKey(key)] = value;
                }
                return acc;
            }, {});
            const studentNumber = extractValue(normalizedRow, [
                "student id", "student_id", "student number", "studentnumber", "student_no", "studentno", "matric", "matric no",
            ]);
            const fullName = extractValue(normalizedRow, ["name", "full name", "fullname", "student name"]);
            const sex = extractValue(normalizedRow, ["sex", "gender"]) || "";
            const idOrPassport = extractValue(normalizedRow, ["id_or_passport", "id or passport", "passport", "idpassport", "id"]) || "";
            const phone = extractValue(normalizedRow, ["phone", "phone number", "phone_number", "mobile", "mobile number"]) || "";
            const email = extractValue(normalizedRow, ["email", "email address", "email_address", "e-mail"]);
            if (!studentNumber || !fullName || !email) {
                errors.push({ row: i + 2, error: "Missing required fields (Student ID, Name or Email)" });
                continue;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push({ row: i + 2, error: "Invalid email format" });
                continue;
            }
            try {
                const existingUser = await prisma_js_1.default.user.findUnique({ where: { email } });
                const supervisors = await prisma_js_1.default.supervisor.findMany();
                if (supervisors.length === 0) {
                    return res.status(400).json({ success: 0, errors: [{ row: 0, error: "No supervisors in database" }] });
                }
                const supervisor = supervisors[i % supervisors.length];
                if (existingUser) {
                    errors.push({ row: i + 2, error: "Email already exists" });
                    continue;
                }
                const existingStudent = await prisma_js_1.default.student.findUnique({
                    where: { studentNumber: String(studentNumber) },
                });
                if (existingStudent) {
                    errors.push({ row: i + 2, error: `Student ID ${studentNumber} already exists` });
                    continue;
                }
                await prisma_js_1.default.user.create({
                    data: {
                        name: fullName,
                        email,
                        role: "STUDENT",
                        studentProfile: {
                            create: {
                                studentNumber: String(studentNumber),
                                fullName: String(fullName),
                                sex: sex ? String(sex) : null,
                                idOrPassport: idOrPassport ? String(idOrPassport) : null,
                                phone: phone ? String(phone) : null,
                                email: String(email),
                                profileCompleted: false,
                                supervisor: {
                                    connect: { id: supervisor.id },
                                },
                            },
                        },
                    },
                });
                successCount++;
            }
            catch (dbErr) {
                errors.push({ row: i + 2, error: dbErr.message || "Database error" });
            }
        }
        return res.json({
            success: successCount,
            errors,
            message: `Imported ${successCount} students. ${errors.length} errors.`,
        });
    }
    catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({
            success: 0,
            errors: [{ row: 0, error: err.message || "Failed to process file" }],
        });
    }
});
// POST send-invites
router.post("/send-invites", async (req, res) => {
    try {
        let { studentIds } = req.body;
        if (!studentIds || studentIds.length === 0) {
            const students = await prisma_js_1.default.student.findMany({
                where: { profileCompleted: false },
                include: { user: true },
            });
            studentIds = students.map((s) => s.id);
        }
        const results = { success: [], errors: [] };
        for (const id of studentIds) {
            try {
                const student = await prisma_js_1.default.student.findUnique({
                    where: { id: Number(id) },
                    include: { user: true },
                });
                if (!student) {
                    results.errors.push({ row: { id }, error: "Student not found" });
                    continue;
                }
                let token = student.profileToken;
                if (!token) {
                    token = (0, utils_js_1.generateToken)();
                    await prisma_js_1.default.student.update({ where: { id: student.id }, data: { profileToken: token } });
                }
                await (0, email_js_1.sendProfileCompletionEmail)(student.user.email, token);
                results.success.push({
                    email: student.user.email,
                    name: student.user.name,
                    studentId: student.id,
                });
            }
            catch (err) {
                results.errors.push({ row: { id }, error: err.message });
            }
        }
        return res.json({
            message: `Processed ${studentIds.length} invitations`,
            success: results.success.length,
            errors: results.errors.length,
            results,
        });
    }
    catch (err) {
        console.error("Invite error:", err);
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
