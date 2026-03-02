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
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [PrismaModule, AuthModule, StudentsModule, SupervisorsModule, TasksModule, AdminModule, NotificationsModule, LogEntriesModule, ChatModule],
  controllers: [AppController],
})
export class AppModule { }
