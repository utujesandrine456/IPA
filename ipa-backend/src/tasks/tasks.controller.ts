import { Controller, Get, Post, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    @ApiOperation({ summary: 'Get all tasks', description: 'Retrieve tasks with optional filters by student or supervisor' })
    @ApiQuery({ name: 'studentId', required: false, type: 'number', description: 'Filter by student ID' })
    @ApiQuery({ name: 'supervisorId', required: false, type: 'number', description: 'Filter by supervisor ID' })
    @ApiResponse({ status: 200, description: 'Returns array of tasks' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAll(@Query('studentId') studentId?: string, @Query('supervisorId') supervisorId?: string) {
        return this.tasksService.findAll(studentId ? Number(studentId) : undefined, supervisorId ? Number(supervisorId) : undefined);
    }

    @Post()
    @ApiOperation({ summary: 'Create task', description: 'Create a new task assignment for a student' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                studentId: { type: 'number', example: 1 },
                title: { type: 'string', example: 'Complete project documentation' },
                description: { type: 'string', example: 'Write comprehensive documentation for the project' },
                status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED'], example: 'PENDING' }
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Task created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    async create(@Body() body: any) {
        return this.tasksService.create(body);
    }

    @Patch()
    @ApiOperation({ summary: 'Update task', description: 'Update task status, submission, or rating' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED'], example: 'SUBMITTED' },
                submissionContent: { type: 'string', example: 'Task completed as requested' },
                rating: { type: 'number', minimum: 1, maximum: 5, example: 4 }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Task updated successfully' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    async update(@Body() body: any) {
        return this.tasksService.update(body);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete task', description: 'Permanently delete a task by ID' })
    @ApiResponse({ status: 200, description: 'Task deleted successfully' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    async remove(@Param('id') id: string) {
        return this.tasksService.remove(Number(id));
    }
}
