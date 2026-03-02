import { Module } from '@nestjs/common';
import { SupervisorsService } from './supervisors.service';
import { SupervisorsController } from './supervisors.controller';

@Module({
    providers: [SupervisorsService],
    controllers: [SupervisorsController],
})
export class SupervisorsModule { }
