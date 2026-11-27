import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { userDto } from './dto/users.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('users')
export class UsersController {
    
    constructor(private readonly uService: UsersService) {}

    // get user b email
    @Get('email')
    async getUserEmail(@Body() email: string) {
        const result = await this.uService.findUser(email)
        return result;
    }

    // create user registry
    @Post('new')
    async createUserRegis(@Body() dto: userDto) {
        const newUser = await this.uService.newUser(dto)
        return newUser
    }

    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }

}
