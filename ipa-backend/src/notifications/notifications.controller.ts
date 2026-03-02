import { Controller, Delete, Get, Request, UseGuards, Param, Body, Patch, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  async getMyNotifications(@Request() req: any) {
    return this.notificationsService.findUserNotifications(req.user.userId, req.user.role);
  }

  @Delete('clear')
  async clearNotifications(@Request() req: any) {
    return this.notificationsService.clearNotifications(req.user.userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(Number(id));
  }

  @Post()
  async createNotification(@Body() data: any) {
    return this.notificationsService.createNotification(data);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(Number(id));
  }
}
