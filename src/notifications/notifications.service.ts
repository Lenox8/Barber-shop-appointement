import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';


interface BookingCreatedMessage {
    eventId: string;

    payload: {
        bookingId: string;
        userId: string;
        cutId: string;
        scheduledAt: string;
    }
}
@Injectable()
export class NotificationsService {
    constructor(private readonly db: SupabaseService) {}

    async createBookingNotification(event: BookingCreatedMessage) {
        const { eventId, payload } = event

        const scheduledDate = new Date(
            payload.scheduledAt,
        ).toLocaleString('pt-MZ', {
            timeZone: 'Africa/Maputo'
        })
        
        const [notificaiton] = await this.db.client`
        INSERT INTO notifications (
            event_id,
            user_id,
            title,
            message
        )
        VALUES (
            ${eventId},
            ${payload.userId},
            ${'Corte agendado'},
            ${`O seu corte foi agendado para ${scheduledDate}`}
        )
        ON CONFLICT (event_id) DO NOTHING
        RETURNING *
        `;
        return notificaiton ?? null
    }
}
