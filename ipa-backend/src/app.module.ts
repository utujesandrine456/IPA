import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { SupervisorsModule } from './supervisors/supervisors.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LogEntriesModule } from './log-entries/log-entries.module';
import { WeeklyLogsModule } from './weekly-logs/weekly-logs.module';
import { IapReportsModule } from './iap-reports/iap-reports.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StudentsModule,
    SupervisorsModule,
    TasksModule,
    AdminModule,
    NotificationsModule,
    LogEntriesModule,
    WeeklyLogsModule,
    IapReportsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
