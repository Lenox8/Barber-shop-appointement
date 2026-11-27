import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationsService } from './notifications.service.js';

interface BookingCreatedMessage {
  eventId: string;
  eventType: string;

  payload: {
    bookingId: string;
    userId: string;
    cutId: string;
    scheduledAt: string;
  };

  occurredAt: string;
}

@Injectable()
export class NotificationsConsumer {
  private readonly logger = new Logger(
    NotificationsConsumer.name,
  );

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @RabbitSubscribe({
    exchange: 'notifications_exchange',
    routingKey: 'booking.created',
    queue: 'notifications',
    queueOptions: {
      durable: true,
    },
  })
  async handleBookingCreated(
    message: BookingCreatedMessage,
  ) {
    const event: BookingCreatedMessage = {
        ...message,
        payload: typeof message.payload === 'string'
        ? JSON.parse(message.payload) as BookingCreatedMessage['payload']
        : message.payload
    }
    console.log('FULL RABBIT MESSAEGE:', JSON.stringify(event, null, 2))
    this.logger.log(
      `Received booking event: ${event.eventId}`,
    );

    await this.notificationsService.createBookingNotification(
      event,
    );
  }
}