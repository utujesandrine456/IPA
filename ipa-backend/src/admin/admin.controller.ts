import { Controller, Get, Post, Delete, Query, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    async getUsers() {
        return this.adminService.getUsers();
    }

    @Get('activity')
    async getActivity() {
        return this.adminService.getActivity();
    }

    @Delete('users')
    async deleteUser(@Query('id') id: string) {
        return this.adminService.deleteUser(Number(id));
    }

    @Post('add-user')
    async addUser(@Body() body: any) {
        return this.adminService.addUser(body);
    }

    @Post('toggle-activation')
    async toggleActivation(@Body() body: { id: number }) {
        return this.adminService.toggleActivation(body.id);
    }
}
