import { Module } from '@nestjs/common';
import { OutboxPublisherService } from './outbox-publisher.service.js';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Module({
  providers: [OutboxPublisherService, AmqpConnection],
})
export class OutboxModule {}