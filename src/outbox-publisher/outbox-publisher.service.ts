import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Interval } from '@nestjs/schedule';


@Injectable()
export class OutboxPublisherService {

    private readonly logger = new Logger(OutboxPublisherService.name);

    constructor(
        private readonly db: SupabaseService,
        private readonly amqp: AmqpConnection,
    ) {}

    @Interval(3000)
    async publishPendingEvents () {
        try {
            await this.db.client.begin(async (tx) => {

                // block selected events during the processing
                const events = await tx`
                SELECT * 
                FROM outbox_events
                WHERE published_at IS NULL
                ORDER BY created_at ASC
                LIMIT 20
                FOR UPDATE SKIP LOCKED
                `;

                for (const event of events) {
                    await this.amqp.publish(
                        'notifications_exchange',
                        event.event_type,
                        {
                            eventId: event.id,
                            eventType: event.event_type,
                            payload: event.payload,
                            ocurredAt: event.created_at
                        },
                        {
                            persistent: true,
                            messageId: event.id,
                            contentType: 'application/json',
                        }
                    );
                    await  tx`
                    UPDATE outbox_events
                    SET published_at = NOW()
                    WHERE id = ${event.id}
                    `

                    this.logger.log(`Event published: ${event.id}`)
                }
            })
        } catch (error) {
            this.logger.error(
                'Failed to publish pending events', error
            )
        }
    }
}
