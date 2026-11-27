import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { agendarCorteDto } from './dto/schedule.dto.js';
import { ScheduleService } from './schedule.service.js';

@Controller('schedule')
export class ScheduleController {
    constructor(private readonly agendarCorte: ScheduleService) {}

    // protected routes
    @UseGuards(JwtAuthGuard)
    @Post('cutSchedule')
    async agendarCut(
        @Body() dto: agendarCorteDto,
        @Req() req: any,
) {
    const userId = req.user.id
    return await this.agendarCorte.agendarCorte(userId, dto)
    }

    // barber relationated bookings
    @UseGuards(JwtAuthGuard)
    @Get('myBookings')
    async getBookingsByBarber(@Req() req: any) {
        const userId = req.user.id
       return await this.agendarCorte.getAllBooking(userId)
    }   
}
