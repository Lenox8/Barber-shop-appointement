import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { UsersService } from '../users/users.service.js';
import { agendarCorteDto } from './dto/schedule.dto.js';
import { DateTime } from 'luxon'


export interface bookings {
    id: string;
    scheduled_at: string;
    cut_id: string;
    user_id: string;
    status_att: string;
    created_at: string;
    updated_at: string;
}


@Injectable()
export class ScheduleService {
    constructor(private readonly db: SupabaseService,
        private readonly userService: UsersService
    ) {}

   
    // get available bookings
    async getAllBooking(userId: string): Promise<bookings[]>{
        const bookings = await this.db.client<bookings[]>`
        SELECT 
            r.*,
            b.name AS barber_name
        FROM reservas r
        INNER JOIN barbers b
            ON b.id = r.barber_id
        WHERE b.user_id = ${userId}
        ORDER BY r.scheduled_at ASC
        `
        if (bookings.length === 0) {
            return []
        }
        return bookings as bookings[]

    }
    // agendar corte
    async agendarCorte(userId: string, dto: agendarCorteDto) {
        // 1 user timez
        const tz = await this.userService.getUserTimezone(userId)

        // actual dat fro user timezone
        const today = DateTime.now()
            .setZone(tz)
            .toISODate()

        if (!today) {
            throw new BadRequestException('invalid timezone')
        }

        // getCut id
        const [cut_id] = await this.db.client`
        SELECT * FROM  stylist WHERE id = ${dto.cut_id} LIMIT 1
        `;

        if (!cut_id) {
            throw new NotFoundException('Cut not found')
        }
        
        // convert to local Date time by tz
        const localDateTime = DateTime.fromISO(
            `${today}T${dto.scheduled_at}`,
            { zone: tz }
        )
        
        
        if (!localDateTime.isValid) {
            throw new BadRequestException('invalid scheduled time')
        }
        // convert to UTC and return js equivalent Date to this Datetime
        const scheduledAt = localDateTime.toUTC().toJSDate()

        // agendamento e event persis on same transaction
        try {
            const result = await this.db.client.begin(async (tx) => {
            
                const [booking] = await tx`
                INSERT INTO reservas(
                    scheduled_at,
                    cut_id,
                    user_id,
                    barber_id
                ) VALUES (
                    ${scheduledAt},
                    ${dto.cut_id},
                    ${userId},
                    ${dto.barber_id}
                )
                RETURNING *
                `;

                const payload = {
                    bookingId: booking.id,
                    userId,
                    cutId: dto.cut_id,
                    barberId: dto.barber_id,
                    scheduledAt: scheduledAt.toISOString(),
                };

                const [event] = await tx`
                INSERT INTO outbox_events (
                    event_type,
                    payload
                )
                VALUES (
                    'booking.created',
                    ${JSON.stringify(payload)}::jsonb
                )
                RETURNING *
                `

                return { booking, event }
            })

            return result.booking
        } catch (error: any) {
             if (error.code === '23505') {
            throw new ConflictException(
                'Este horário já está ocupado '
            );
        }

        throw error;
        }

    }
 
}
