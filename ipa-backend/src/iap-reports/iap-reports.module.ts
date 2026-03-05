import { Module } from '@nestjs/common';
import { IapReportsService } from './iap-reports.service';
import { IapReportsController } from './iap-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IapReportsController],
    providers: [IapReportsService],
})
export class IapReportsModule { }
