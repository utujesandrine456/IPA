import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findUserNotifications(userId: number, role: string) {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId },
          { targetRole: role as any },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async deleteNotification(id: number) {
    return this.prisma.notification.delete({
        where: {
            id: Number(id),
        },
    });
}

  async clearNotifications(userId: number) {
    return this.prisma.notification.deleteMany({
      where: {
        userId: userId,
      },
    });
  }

  async createNotification(data: any) {
    return this.prisma.notification.create({
      data,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: {
        id: id,
      },
      data: {
        read: true,
      },
    });
  }
}