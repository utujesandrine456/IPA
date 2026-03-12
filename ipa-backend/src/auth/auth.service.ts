import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcryptjs';
import pkg from 'jsonwebtoken';
import { generateToken } from '../lib/utils';
import { sendResetPasswordEmail } from '../lib/email';

const { sign } = pkg;

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;

  constructor(private prisma: PrismaService) { }

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        supervisorProfile: true,
        liaisonProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Rate Limiting & Account Lock Check
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      throw new ForbiddenException(`Account locked due to multiple failed attempts. Try again after ${user.lockUntil.toLocaleTimeString()}.`);
    }

    // Activation Check
    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated by an administrator. Please contact support.');
    }

    if (!user.password) {
      throw new ForbiddenException('Account not activated. Please check your email for the activation link.');
    }

    const isValid = await bcrypt.compare(pass, user.password);

    if (!isValid) {
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // Reset attempts if the last attempt was more than a minute ago
      let loginAttempts = user.loginAttempts;
      if (!user.lastAttemptAt || user.lastAttemptAt < oneMinuteAgo) {
        loginAttempts = 1;
      } else {
        loginAttempts += 1;
      }

      let lockUntil: Date | null = null;
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

      throw new UnauthorizedException('Invalid credentials');
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

    const token = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion
      },
      this.JWT_SECRET,
      { expiresIn: '1d' },
    );

    const userResponse: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
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
    } else if (user.role === 'SUPERVISOR' && user.supervisorProfile) {
      userResponse.supervisorId = user.supervisorProfile.id;
      userResponse.supervisorProfile = {
        id: user.supervisorProfile.id,
      };
    } else if (user.role === 'LIAISON' && user.liaisonProfile) {
      userResponse.liaisonId = user.liaisonProfile.id;
      userResponse.liaisonProfile = {
        id: user.liaisonProfile.id,
      };
    }

    return {
      message: 'Login successful',
      user: userResponse,
      token,
    };
  }

  async getCurrentUser(userId: string | number) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        studentProfile: true,
        supervisorProfile: true,
        liaisonProfile: true,
      }
    });

    if (!user) return null;

    const userResponse: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion,
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
    } else if (user.role === 'SUPERVISOR' && user.supervisorProfile) {
      userResponse.supervisorId = user.supervisorProfile.id;
      userResponse.supervisorProfile = {
        id: user.supervisorProfile.id,
      };
    } else if (user.role === 'LIAISON' && user.liaisonProfile) {
      userResponse.liaisonId = user.liaisonProfile.id;
      userResponse.liaisonProfile = {
        id: user.liaisonProfile.id,
      };
    }

    return userResponse;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account exists with that email, a reset link has been sent.' };
    }

    const token = generateToken(64);
    const expires = new Date(Date.now() + 3600 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    await sendResetPasswordEmail(user.email, token);

    return { message: 'Reset link sent successfully' };
  }

  async resetPassword(token: string, newPass: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

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

  async changePassword(userId: number, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found or password not set');
    }

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) {
      throw new BadRequestException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 } // Logout other sessions
      }
    });

    return { message: 'Password changed successfully' };
  }

  async updateMe(userId: number, name: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { name }
    });
    return { message: 'User updated successfully', name: updated.name };
  }
}
