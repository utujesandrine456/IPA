import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    Request,
} from '@nestjs/common';
import { WeeklyLogsService } from './weekly-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('weekly-logs')
@UseGuards(JwtAuthGuard)
export class WeeklyLogsController {
    constructor(private readonly weeklyLogsService: WeeklyLogsService) { }

    @Get()
    async findAll(@Query('studentId', ParseIntPipe) studentId: number) {
        return this.weeklyLogsService.findByStudent(studentId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.weeklyLogsService.findOne(id);
    }

    @Post()
    async create(@Body() body: { studentId: number; date?: string }) {
        const date = body.date ? new Date(body.date) : new Date();
        return this.weeklyLogsService.findOrCreateWeek(body.studentId, date);
    }

    @Patch(':id/submit')
    async submit(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { summary: string; objectives: string },
    ) {
        return this.weeklyLogsService.submitWeek(id, body);
    }

    @Patch(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('SUPERVISOR')
    async approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { note?: string },
        @Request() req: any,
    ) {
        return this.weeklyLogsService.approveWeek(id, req.user.id, body.note);
    }

    @Patch(':id/reject')
    @UseGuards(RolesGuard)
    @Roles('SUPERVISOR')
    async reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { note: string },
        @Request() req: any,
    ) {
        return this.weeklyLogsService.rejectWeek(id, req.user.id, body.note);
    }
}