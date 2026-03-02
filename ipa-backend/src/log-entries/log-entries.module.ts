import { Module } from '@nestjs/common';
import { LogEntriesService } from './log-entries.service';
import { LogEntriesController } from './log-entries.controller';

@Module({
    providers: [LogEntriesService],
    controllers: [LogEntriesController],
})
export class LogEntriesModule { }
