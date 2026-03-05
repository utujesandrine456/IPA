"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const students_module_1 = require("./students/students.module");
const supervisors_module_1 = require("./supervisors/supervisors.module");
const tasks_module_1 = require("./tasks/tasks.module");
const admin_module_1 = require("./admin/admin.module");
const notifications_module_1 = require("./notifications/notifications.module");
const log_entries_module_1 = require("./log-entries/log-entries.module");
const weekly_logs_module_1 = require("./weekly-logs/weekly-logs.module");
const iap_reports_module_1 = require("./iap-reports/iap-reports.module");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            students_module_1.StudentsModule,
            supervisors_module_1.SupervisorsModule,
            tasks_module_1.TasksModule,
            admin_module_1.AdminModule,
            notifications_module_1.NotificationsModule,
            log_entries_module_1.LogEntriesModule,
            weekly_logs_module_1.WeeklyLogsModule,
            iap_reports_module_1.IapReportsModule,
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 10,
                }]),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
