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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const XLSX = __importStar(require("xlsx"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const utils_1 = require("../lib/utils");
const email_1 = require("../lib/email");
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { id, supervisorId, limit: limitParam, offset: offsetParam } = query;
        if (id) {
            const studentId = Number(id);
            if (Number.isNaN(studentId)) {
                throw new common_1.BadRequestException('Invalid student id');
            }
            const student = await this.prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    supervisor: { include: { user: true } },
                },
            });
            if (!student) {
                throw new common_1.NotFoundException('Student not found');
            }
            return { student };
        }
        const limit = parseInt(limitParam || '1000');
        const offset = parseInt(offsetParam || '0');
        const whereClause = supervisorId ? { supervisorId: Number(supervisorId) } : {};
        const students = await this.prisma.student.findMany({
            where: whereClause,
            take: limit,
            skip: offset,
            include: {
                user: { select: { id: true, name: true, email: true } },
                supervisor: { include: { user: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { students };
    }
    async updateProfile(body) {
        const { studentId, phone, address, companyName, companyAddress, supervisorName, supervisorEmail, supervisorId } = body;
        if (!studentId) {
            throw new common_1.BadRequestException('Student ID is required');
        }
        const updateData = {
            phone, address, companyName, companyAddress,
            supervisorName, supervisorEmail,
            profileCompleted: true,
        };
        if (supervisorId) {
            updateData.supervisorId = Number(supervisorId);
        }
        const updatedStudent = await this.prisma.student.update({
            where: { id: Number(studentId) },
            data: updateData,
        });
        return { message: 'Profile updated successfully', student: updatedStudent };
    }
    async findByToken(token) {
        if (!token) {
            throw new common_1.BadRequestException('Token is required');
        }
        const student = await this.prisma.student.findUnique({
            where: { profileToken: String(token) },
            include: {
                user: true,
                supervisor: { include: { user: true } },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException('Invalid or expired token');
        }
        if (student.profileCompleted) {
            throw new common_1.BadRequestException('Profile already completed');
        }
        return { student };
    }
    async completeProfile(body) {
        const { token, password, phone, address, companyName, companyAddress, companyPhone, companyEmail, supervisorName, supervisorEmail, internshipStart, internshipEnd, supervisorId, } = body;
        if (!token) {
            throw new common_1.BadRequestException('Token is required');
        }
        const student = await this.prisma.student.findUnique({
            where: { profileToken: token },
            include: { user: true },
        });
        if (!student) {
            throw new common_1.NotFoundException('Invalid or expired token');
        }
        if (student.profileCompleted) {
            throw new common_1.BadRequestException('Profile already completed');
        }
        let targetSupervisorId = student.supervisorId || 0;
        if (supervisorId) {
            const supervisorExists = await this.prisma.supervisor.findUnique({
                where: { id: Number(supervisorId) },
            });
            if (!supervisorExists) {
                throw new common_1.BadRequestException('Invalid supervisor ID');
            }
            targetSupervisorId = Number(supervisorId);
        }
        let hashedPassword = student.user.password;
        if (password) {
            hashedPassword = await bcryptjs_1.default.hash(password, 10);
        }
        await this.prisma.user.update({
            where: { id: student.userId },
            data: { password: hashedPassword },
        });
        const updatedStudent = await this.prisma.student.update({
            where: { id: student.id },
            data: {
                phone, address, companyName, companyAddress,
                companyPhone, companyEmail, supervisorName, supervisorEmail,
                internshipStart: internshipStart ? new Date(internshipStart) : null,
                internshipEnd: internshipEnd ? new Date(internshipEnd) : null,
                supervisorId: targetSupervisorId > 0 ? targetSupervisorId : undefined,
                profileCompleted: true,
                profileToken: null,
            },
            include: {
                user: true,
                supervisor: { include: { user: true } },
            },
        });
        return {
            message: 'Profile completed and verified successfully',
            student: updatedStudent,
        };
    }
    async uploadStudents(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const normalizeKey = (key) => key.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const extractValue = (normalizedRow, aliases) => {
            for (const alias of aliases) {
                const value = normalizedRow[normalizeKey(alias)];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
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
                if (typeof key === 'string')
                    acc[normalizeKey(key)] = value;
                return acc;
            }, {});
            const studentNumber = extractValue(normalizedRow, ['student id', 'student_id', 'student number', 'studentnumber', 'student_no', 'studentno', 'matric', 'matric no']);
            const fullName = extractValue(normalizedRow, ['name', 'full name', 'fullname', 'student name']);
            const sex = extractValue(normalizedRow, ['sex', 'gender']) || '';
            const idOrPassport = extractValue(normalizedRow, ['id_or_passport', 'id or passport', 'passport', 'idpassport', 'id']) || '';
            const phone = extractValue(normalizedRow, ['phone', 'phone number', 'phone_number', 'mobile', 'mobile number']) || '';
            const email = extractValue(normalizedRow, ['email', 'email address', 'email_address', 'e-mail']);
            if (!studentNumber || !fullName || !email) {
                errors.push({ row: i + 2, error: 'Missing required fields (Student ID, Name or Email)' });
                continue;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push({ row: i + 2, error: 'Invalid email format' });
                continue;
            }
            try {
                const existingUser = await this.prisma.user.findUnique({ where: { email } });
                const supervisors = await this.prisma.supervisor.findMany();
                if (supervisors.length === 0) {
                    errors.push({ row: i + 2, error: 'No supervisors available. Please add a supervisor first.' });
                    continue;
                }
                const supervisor = supervisors[i % supervisors.length];
                if (existingUser) {
                    errors.push({ row: i + 2, error: 'Email already exists' });
                    continue;
                }
                const existingStudent = await this.prisma.student.findUnique({ where: { studentNumber: String(studentNumber) } });
                if (existingStudent) {
                    errors.push({ row: i + 2, error: `Student ID ${studentNumber} already exists` });
                    continue;
                }
                await this.prisma.user.create({
                    data: {
                        name: fullName,
                        email,
                        role: 'STUDENT',
                        studentProfile: {
                            create: {
                                studentNumber: String(studentNumber),
                                fullName: String(fullName),
                                sex: sex ? String(sex) : null,
                                idOrPassport: idOrPassport ? String(idOrPassport) : null,
                                phone: phone ? String(phone) : null,
                                email: String(email),
                                profileCompleted: false,
                                supervisor: { connect: { id: supervisor.id } },
                            },
                        },
                    },
                });
                successCount++;
            }
            catch (dbErr) {
                errors.push({ row: i + 2, error: dbErr.message || 'Database error' });
            }
        }
        return { success: successCount, errors, message: `Imported ${successCount} students. ${errors.length} errors.` };
    }
    async sendInvites(body) {
        let { studentIds } = body;
        if (!studentIds || studentIds.length === 0) {
            const students = await this.prisma.student.findMany({
                where: { profileCompleted: false },
                include: { user: true },
            });
            studentIds = students.map((s) => s.id);
        }
        const results = { success: [], errors: [] };
        for (const id of studentIds) {
            try {
                const student = await this.prisma.student.findUnique({
                    where: { id: Number(id) },
                    include: { user: true },
                });
                if (!student) {
                    results.errors.push({ row: { id }, error: 'Student not found' });
                    continue;
                }
                let token = student.profileToken;
                if (!token) {
                    token = (0, utils_1.generateToken)();
                    await this.prisma.student.update({ where: { id: student.id }, data: { profileToken: token } });
                }
                await (0, email_1.sendProfileCompletionEmail)(student.user.email, token);
                results.success.push({ email: student.user.email, name: student.user.name, studentId: student.id });
            }
            catch (err) {
                results.errors.push({ row: { id }, error: err.message });
            }
        }
        return { message: `Processed ${studentIds.length} invitations`, success: results.success.length, errors: results.errors.length, results };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
