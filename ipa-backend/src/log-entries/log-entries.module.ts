import { Module } from '@nestjs/common';
import { LogEntriesService } from './log-entries.service';
import { LogEntriesController } from './log-entries.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WeeklyLogsModule } from '../weekly-logs/weekly-logs.module';

@Module({
    imports: [PrismaModule, WeeklyLogsModule],
    providers: [LogEntriesService],
    controllers: [LogEntriesController],
})
export class LogEntriesModule { }
