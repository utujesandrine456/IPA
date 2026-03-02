"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SupervisorsService = class SupervisorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Supervisor not found');
        }
        return { supervisor };
    }
    async update(id, data) {
        const updated = await this.prisma.supervisor.update({
            where: { id },
            data
        });
        return { message: 'Supervisor updated successfully', supervisor: updated };
    }
};
exports.SupervisorsService = SupervisorsService;
exports.SupervisorsService = SupervisorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupervisorsService);
