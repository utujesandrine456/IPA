import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { IapReportsService } from './iap-reports.service';

@Controller('iap-reports')
export class IapReportsController {
    constructor(private readonly iapReportsService: IapReportsService) { }

    @Get()
    async getReport(@Query('studentId') studentId: string) {
        return this.iapReportsService.findByStudent(Number(studentId));
    }

    @Post()
    async upsertReport(@Body() data: any) {
        return this.iapReportsService.upsert(data);
    }
}
