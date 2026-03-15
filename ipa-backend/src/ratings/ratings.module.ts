import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WeeklyLogsModule } from '../weekly-logs/weekly-logs.module';


@Module({
    imports: [PrismaModule, WeeklyLogsModule],
    controllers: [RatingsController],
    providers: [RatingsService],
    exports: [RatingsService],
})
export class RatingsModule { }
