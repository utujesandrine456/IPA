import { Controller, Get, Post, Query, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get()
    async getMessages(
        @Query('userId') userId: string,
        @Query('otherUserId') otherUserId: string,
    ) {
        return this.chatService.getMessages(Number(userId), Number(otherUserId));
    }

    @Post()
    async sendMessage(
        @Body() body: { senderId: number; receiverId: number; content?: string; fileUrl?: string; fileName?: string },
    ) {
        return this.chatService.sendMessage(body);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(process.cwd(), 'uploads', 'chat'),
                filename: (_req, file, cb) => {
                    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
                    cb(null, unique + extname(file.originalname));
                },
            }),
            limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        return {
            fileUrl: `/uploads/chat/${file.filename}`,
            fileName: file.originalname,
        };
    }

    @Get('peers')
    async getPeers(@Query('studentId') studentId: string) {
        return this.chatService.getPeers(Number(studentId));
    }

    @Get('unread')
    async getUnreadCount(@Query('userId') userId: string) {
        return this.chatService.getUnreadCount(Number(userId));
    }
}
