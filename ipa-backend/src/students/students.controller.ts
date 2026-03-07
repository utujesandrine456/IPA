import { Controller, Get, Post, Patch, Body, Query, UseInterceptors, UploadedFile, Param, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Get()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all students', description: 'Retrieve list of students with optional filters' })
    @ApiQuery({ name: 'supervisorId', required: false, type: 'number', description: 'Filter by supervisor ID' })
    @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search by name or student number' })
    @ApiResponse({ status: 200, description: 'Returns array of students' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAll(@Query() query: any) {
        return this.studentsService.findAll(query);
    }

    @Get(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get student by ID', description: 'Retrieve student information by their ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
    @ApiResponse({ status: 200, description: 'Returns student information' })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.studentsService.findOne(id);
    }

    @Patch(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update student profile', description: 'Update student profile information' })
    @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 404, description: 'Student not found' })
    async updateProfile(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.studentsService.updateProfile(id, body);
    }

    @Get('complete-profile')
    @ApiOperation({ summary: 'Get student by token', description: 'Retrieve student information using profile completion token' })
    @ApiQuery({ name: 'token', type: 'string', description: 'Profile completion token from email' })
    @ApiResponse({ status: 200, description: 'Returns student information' })
    @ApiResponse({ status: 404, description: 'Invalid or expired token' })
    async findByToken(@Query('token') token: string) {
        return this.studentsService.findByToken(token);
    }

    @Post('complete-profile')
    @ApiOperation({ summary: 'Complete student profile', description: 'Complete student profile using token from invitation email' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string', example: 'profile-token-from-email' },
                password: { type: 'string', example: 'newPassword123' },
                fullName: { type: 'string', example: 'John Doe' },
                phone: { type: 'string', example: '+250788123456' },
                address: { type: 'string', example: 'Kigali, Rwanda' },
                sex: { type: 'string', example: 'Male' },
                idOrPassport: { type: 'string', example: 'ID123456' }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Profile completed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid token or data' })
    async completeProfile(@Body() body: any) {
        return this.studentsService.completeProfile(body);
    }

    @Post('upload')
    @ApiBearerAuth('JWT-auth')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload students from Excel', description: 'Bulk upload students using Excel file' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Students uploaded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid file format' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadStudents(@UploadedFile() file: Express.Multer.File) {
        return this.studentsService.uploadStudents(file);
    }

    @Post('send-invites')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Send profile completion invites', description: 'Send profile completion emails to selected students' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                studentIds: { type: 'array', items: { type: 'number' }, example: [1, 2, 3] }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Invites sent successfully' })
    async sendInvites(@Body() body: any) {
        return this.studentsService.sendInvites(body);
    }
}
