import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { signInDto, signUpDto } from './dto/auth.dto.js';
import { Public } from './set-public.route.js';

@Controller('auth')
export class AuthController {

    constructor(private readonly authServ: AuthService) {}

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    async signIn(@Body() dto: signInDto) {
        return await this.authServ.signIn(dto)
    }

    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post('signUp')
    async signUp(@Body() dto: signUpDto) {
        return await this.authServ.signUp(dto)
    }
}
