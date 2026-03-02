import { Controller, Get, Post, Patch, Body, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Get()
    async findAll(@Query() query: any) {
        return this.studentsService.findAll(query);
    }

    @Patch('update')
    async updateProfile(@Body() body: any) {
        return this.studentsService.updateProfile(body);
    }

    @Get('complete-profile')
    async findByToken(@Query('token') token: string) {
        return this.studentsService.findByToken(token);
    }

    @Post('complete-profile')
    async completeProfile(@Body() body: any) {
        return this.studentsService.completeProfile(body);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadStudents(@UploadedFile() file: Express.Multer.File) {
        return this.studentsService.uploadStudents(file);
    }

    @Post('send-invites')
    async sendInvites(@Body() body: any) {
        return this.studentsService.sendInvites(body);
    }
}
