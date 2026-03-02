"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const notifications_service_1 = require("./notifications.service");
describe('NotificationsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [notifications_service_1.NotificationsService],
        }).compile();
        service = module.get(notifications_service_1.NotificationsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
