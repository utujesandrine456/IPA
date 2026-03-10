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
    Res,
} from '@nestjs/common';
import { WeeklyLogsService } from './weekly-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { Response } from 'express';

@Controller('weekly-logs')
@UseGuards(JwtAuthGuard)
export class WeeklyLogsController {
    constructor(private readonly weeklyLogsService: WeeklyLogsService) { }

    @Get()
    async findAll(
        @Query('studentId') studentId?: string,
        @Query('supervisorId') supervisorId?: string,
        @Query('liaisonId') liaisonId?: string,
    ) {
        if (studentId) {
            const logs = await this.weeklyLogsService.findByStudent(parseInt(studentId));
            return { logs };
        }
        if (supervisorId) {
            const logs = await this.weeklyLogsService.findBySupervisor(parseInt(supervisorId));
            return { logs };
        }
        if (liaisonId) {
            const logs = await this.weeklyLogsService.findByLiaison(parseInt(liaisonId));
            return { logs };
        }
        return { logs: [] };
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.weeklyLogsService.findOne(id);
    }

    @Post()
    async createOrUpdate(@Body() body: any) {
        // If it's just generating an empty week (only studentId & date)
        if (Object.keys(body).length === 2 && body.studentId && body.date) {
            const date = body.date ? new Date(body.date) : new Date();
            return this.weeklyLogsService.findOrCreateWeek(body.studentId, date);
        }
        // Otherwise save the actual content
        return this.weeklyLogsService.upsert(body);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { status: 'SUBMITTED' },
    ) {
        if (body.status === 'SUBMITTED') {
            return this.weeklyLogsService.submitWeek(id, {}); // Uses existing submit function in service to trigger notifications
        }
        return this.weeklyLogsService.findOne(id);
    }

    @Patch(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('SUPERVISOR')
    async approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @Request() req: any,
    ) {
        return this.weeklyLogsService.approveWeek(id, req.user.userId, body);
    }

    @Patch(':id/reject')
    @UseGuards(RolesGuard)
    @Roles('SUPERVISOR')
    async reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { note: string },
        @Request() req: any,
    ) {
        return this.weeklyLogsService.rejectWeek(id, req.user.userId, body.note);
    }

    @Patch(':id/verify-liaison')
    @UseGuards(RolesGuard)
    @Roles('LIAISON')
    async verifyLiaison(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: any,
        @Request() req: any,
    ) {
        return this.weeklyLogsService.verifyLiaison(id, req.user.userId, body);
    }

    @Get(':id/pdf')
    @UseGuards(RolesGuard)
    @Roles('SUPERVISOR', 'LIAISON')
    async downloadPdf(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
        @Request() req: any,
    ) {
        const buffer = await this.weeklyLogsService.generatePdf(id, req.user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="weekly-log-${id}.pdf"`);
        res.send(buffer);
    }
}