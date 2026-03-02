import { Controller, Get, Post, Patch, Body, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    async findAll(@Query('studentId') studentId?: string, @Query('supervisorId') supervisorId?: string) {
        return this.tasksService.findAll(studentId ? Number(studentId) : undefined, supervisorId ? Number(supervisorId) : undefined);
    }

    @Post()
    async create(@Body() body: any) {
        return this.tasksService.create(body);
    }

    @Patch()
    async update(@Body() body: any) {
        return this.tasksService.update(body);
    }
}
