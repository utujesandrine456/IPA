import { Module } from '@nestjs/common';
import { WeeklyLogsController } from './weekly-logs.controller';
import { WeeklyLogsService } from './weekly-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [WeeklyLogsController],
    providers: [WeeklyLogsService],
    exports: [WeeklyLogsService],
})
export class WeeklyLogsModule { }
