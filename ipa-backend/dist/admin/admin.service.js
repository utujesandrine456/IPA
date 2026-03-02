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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let AdminService = class AdminService {
    // Admin service for managing users and activity
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsers() {
        const users = await this.prisma.user.findMany({
            include: {
                studentProfile: true,
                supervisorProfile: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return { users };
    }
    async getActivity() {
        const recentTasks = await this.prisma.task.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { student: { include: { user: true } } },
        });
        const recentRatings = await this.prisma.rating.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: { include: { user: true } },
                supervisor: { include: { user: true } },
            },
        });
        const activities = [
            ...recentTasks.map((task) => ({
                type: 'TASK_SUBMISSION',
                id: task.id,
                title: task.title,
                description: task.description,
                user: task.student.user.name,
                date: task.createdAt,
                status: task.status,
            })),
            ...recentRatings.map((rating) => ({
                type: 'RATING',
                id: rating.id,
                title: `Rated ${rating.rating}/10`,
                description: rating.comment,
                user: rating.supervisor.user.name,
                target: rating.student.user.name,
                date: rating.createdAt,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);
        return { activities };
    }
    async deleteUser(id) {
        if (!id) {
            throw new common_1.BadRequestException('User ID required');
        }
        await this.prisma.user.delete({ where: { id } });
        return { success: true };
    }
    async addUser(data) {
        const { email, name, role, password, phone, department } = data;
        if (!email || !name || !role) {
            throw new common_1.BadRequestException('Email, name, and role are required');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                name,
                role,
                password: hashedPassword,
                isActive: true,
                ...(role === 'SUPERVISOR' ? {
                    supervisorProfile: {
                        create: {
                            phone,
                            department,
                        },
                    },
                } : {}),
            },
        });
        return user;
    }
    async toggleActivation(id) {
        const user = await this.prisma.user.findUnique({ where: { id: Number(id) } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return this.prisma.user.update({
            where: { id: Number(id) },
            data: { isActive: !user.isActive },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
