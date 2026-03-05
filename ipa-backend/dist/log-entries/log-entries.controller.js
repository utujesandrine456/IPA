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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogEntriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const log_entries_service_1 = require("./log-entries.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let LogEntriesController = class LogEntriesController {
    constructor(logEntriesService) {
        this.logEntriesService = logEntriesService;
    }
    async findByStudent(studentId) {
        return this.logEntriesService.findByStudent(Number(studentId));
    }
    async create(body) {
        return this.logEntriesService.create(body);
    }
    async update(id, body) {
        return this.logEntriesService.update(id, body);
    }
    async delete(id) {
        return this.logEntriesService.delete(id);
    }
};
exports.LogEntriesController = LogEntriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get student log entries', description: 'Retrieve all log entries for a specific student' }),
    (0, swagger_1.ApiQuery)({ name: 'studentId', type: 'number', description: 'Student ID', example: 1 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns array of log entries' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LogEntriesController.prototype, "findByStudent", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create log entry', description: 'Create a new daily log entry for a student' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                studentId: { type: 'number', example: 1 },
                content: { type: 'string', example: 'Today I worked on implementing the authentication module...' },
                date: { type: 'string', format: 'date-time', example: '2025-03-05T10:00:00Z' },
                mood: { type: 'string', example: 'GREAT' },
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Log entry created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LogEntriesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update log entry', description: 'Update an existing daily log entry' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Log entry updated successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], LogEntriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete log entry', description: 'Delete a specific log entry by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Log entry ID', example: 1 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Log entry deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Log entry not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LogEntriesController.prototype, "delete", null);
exports.LogEntriesController = LogEntriesController = __decorate([
    (0, swagger_1.ApiTags)('Log Entries'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, common_1.Controller)('daily-log'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [log_entries_service_1.LogEntriesService])
], LogEntriesController);
