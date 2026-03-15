import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@ApiBearerAuth('JWT-auth')
@Controller('ratings')
export class RatingsController {
    constructor(private readonly ratingsService: RatingsService) { }

    @Post()
    @ApiOperation({ summary: 'Create student rating', description: 'Allows supervisors to rate students' })
    @ApiResponse({ status: 201, description: 'Rating created successfully' })
    async create(@Body() body: any) {
        return this.ratingsService.create(body);
    }

    @Get()
    @ApiOperation({ summary: 'Get student ratings', description: 'Retrieve ratings for a specific student' })
    async findByStudent(@Query('studentId') studentId: number) {
        const ratings = await this.ratingsService.findByStudent(studentId);
        return { ratings };
    }
}
