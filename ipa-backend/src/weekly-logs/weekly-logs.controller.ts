import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WeeklyLogsService } from './weekly-logs.service';

@Controller('weekly-logs')
export class WeeklyLogsController {
    constructor(private readonly weeklyLogsService: WeeklyLogsService) { }

    @Get()
    async getLogs(@Query('studentId') studentId: string) {
        return this.weeklyLogsService.findByStudent(Number(studentId));
    }

    @Post()
    async upsertLog(@Body() data: any) {
        return this.weeklyLogsService.upsert(data);
    }
}
