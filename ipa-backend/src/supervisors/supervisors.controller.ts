import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { SupervisorsService } from './supervisors.service';

@Controller('supervisors')
export class SupervisorsController {
    constructor(private readonly supervisorsService: SupervisorsService) { }

    @Get()
    async findAll() {
        return this.supervisorsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.supervisorsService.findOne(Number(id));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.supervisorsService.update(Number(id), body);
    }
}
