import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsConsumer } from './notificaations.consumer.js';

@Module({
  providers: [NotificationsService, NotificationsConsumer],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}
