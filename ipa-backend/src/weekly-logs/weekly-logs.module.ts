import { Module } from '@nestjs/common';
import { WeeklyLogsService } from './weekly-logs.service';
import { WeeklyLogsController } from './weekly-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WeeklyLogsController],
    providers: [WeeklyLogsService],
})
export class WeeklyLogsModule { }
