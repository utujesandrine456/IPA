import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { LogEntriesService } from './log-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('daily-log')
@UseGuards(JwtAuthGuard)
export class LogEntriesController {
    constructor(private readonly logEntriesService: LogEntriesService) { }

    @Get()
    async findByStudent(@Query('studentId') studentId: string) {
        return this.logEntriesService.findByStudent(Number(studentId));
    }

    @Post()
    async create(@Body() body: { studentId: number | string; content: string }) {
        return this.logEntriesService.create(body);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.logEntriesService.delete(id);
    }
}
