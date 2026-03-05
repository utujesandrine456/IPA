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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("../lib/utils");
const email_1 = require("../lib/email");
const { sign } = jsonwebtoken_1.default;
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.JWT_SECRET = process.env.JWT_SECRET;
    }
    async login(email, pass) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                studentProfile: true,
                supervisorProfile: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Rate Limiting & Account Lock Check
        const now = new Date();
        if (user.lockUntil && user.lockUntil > now) {
            throw new common_1.ForbiddenException(`Account locked due to multiple failed attempts. Try again after ${user.lockUntil.toLocaleTimeString()}.`);
        }
        // Activation Check
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Your account has been deactivated by an administrator. Please contact support.');
        }
        if (!user.password) {
            throw new common_1.ForbiddenException('Account not activated. Please check your email for the activation link.');
        }
        const isValid = await bcryptjs_1.default.compare(pass, user.password);
        if (!isValid) {
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            // Reset attempts if the last attempt was more than a minute ago
            let loginAttempts = user.loginAttempts;
            if (!user.lastAttemptAt || user.lastAttemptAt < oneMinuteAgo) {
                loginAttempts = 1;
            }
            else {
                loginAttempts += 1;
            }
            let lockUntil = null;
            if (loginAttempts >= 5) {
                lockUntil = new Date(now.getTime() + 60 * 1000); // Lock for 1 minute
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    loginAttempts,
                    lockUntil,
                    lastAttemptAt: now
                }
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Reset attempts on successful login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                loginAttempts: 0,
                lockUntil: null,
                lastAttemptAt: null
            }
        });
        const token = sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            tokenVersion: user.tokenVersion
        }, this.JWT_SECRET, { expiresIn: '3d' });
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            profileCompleted: false,
        };
        if (user.role === 'STUDENT' && user.studentProfile) {
            userResponse.profileCompleted = user.studentProfile.profileCompleted;
            userResponse.studentId = user.studentProfile.id;
            userResponse.studentProfile = {
                id: user.studentProfile.id,
                profileCompleted: user.studentProfile.profileCompleted,
                studentNumber: user.studentProfile.studentNumber,
            };
        }
        else if (user.role === 'SUPERVISOR' && user.supervisorProfile) {
            userResponse.supervisorId = user.supervisorProfile.id;
            userResponse.supervisorProfile = {
                id: user.supervisorProfile.id,
            };
        }
        return {
            message: 'Login successful',
            user: userResponse,
            token,
        };
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: Number(userId) },
            include: {
                studentProfile: true,
                supervisorProfile: true,
            }
        });
        return user;
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // To prevent email enumeration, we return success even if user doesn't exist
            return { message: 'If an account exists with that email, a reset link has been sent.' };
        }
        const token = (0, utils_1.generateToken)(64);
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: expires
            }
        });
        await (0, email_1.sendResetPasswordEmail)(user.email, token);
        return { message: 'Reset link sent successfully' };
    }
    async resetPassword(token, newPass) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPass, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                loginAttempts: 0,
                lockUntil: null
            }
        });
        return { message: 'Password reset successful. You can now login.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
