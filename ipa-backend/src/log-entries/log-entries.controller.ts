import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { LogEntriesService } from './log-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Log Entries')
@ApiBearerAuth('JWT-auth')
@Controller('daily-log')
@UseGuards(JwtAuthGuard)
export class LogEntriesController {
    constructor(private readonly logEntriesService: LogEntriesService) { }

    @Get()
    @ApiOperation({ summary: 'Get student log entries', description: 'Retrieve all log entries for a specific student' })
    @ApiQuery({ name: 'studentId', type: 'number', description: 'Student ID', example: 1 })
    @ApiResponse({ status: 200, description: 'Returns array of log entries' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findByStudent(@Query('studentId') studentId: string) {
        return this.logEntriesService.findByStudent(Number(studentId));
    }

    @Post()
    @ApiOperation({ summary: 'Create log entry', description: 'Create a new daily log entry for a student' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                studentId: { type: 'number', example: 1 },
                content: { type: 'string', example: 'Today I worked on implementing the authentication module...' },
                date: { type: 'string', format: 'date-time', example: '2025-03-05T10:00:00Z' },
                mood: { type: 'string', example: 'GREAT' },
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Log entry created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async create(@Body() body: {
        studentId: number | string;
        content: string;
        date?: string;
        mood?: string;
        weeklyLogId?: number;
    }) {
        return this.logEntriesService.create(body);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update log entry', description: 'Update an existing daily log entry' })
    @ApiResponse({ status: 200, description: 'Log entry updated successfully' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { content?: string; mood?: string }
    ) {
        return this.logEntriesService.update(id, body);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete log entry', description: 'Delete a specific log entry by ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Log entry ID', example: 1 })
    @ApiResponse({ status: 200, description: 'Log entry deleted successfully' })
    @ApiResponse({ status: 404, description: 'Log entry not found' })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.logEntriesService.delete(id);
    }
}
