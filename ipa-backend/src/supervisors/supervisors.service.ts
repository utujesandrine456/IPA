import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupervisorsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const supervisors = await this.prisma.supervisor.findMany({
            include: {
                user: true,
                students: {
                    include: { user: true }
                }
            }
        });
        return { supervisors };
    }

    async findOne(id: number) {
        const supervisor = await this.prisma.supervisor.findUnique({
            where: { id },
            include: {
                user: true,
                students: {
                    include: { user: true }
                }
            }
        });
        if (!supervisor) {
            throw new NotFoundException('Supervisor not found');
        }
        return { supervisor };
    }

    async update(id: number, data: any) {
        const updated = await this.prisma.supervisor.update({
            where: { id },
            data
        });
        return { message: 'Supervisor updated successfully', supervisor: updated };
    }
}
