import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service.js';
import { ScheduleController } from './schedule.controller.js';
import { UsersService } from '../users/users.service.js';

@Module({
  providers: [ScheduleService, UsersService],
  controllers: [ScheduleController]
})
export class SchedulerModule {}
