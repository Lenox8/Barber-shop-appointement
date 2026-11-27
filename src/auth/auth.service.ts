import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { signInDto, signUpDto } from './dto/auth.dto.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants.js';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServ: UsersService,
    private jwtService: JwtService,
  ) {}

  // generate refresh and acess token
  async generateTokens(user: {
  id: string;
  username: string;
  email: string;
}) {
  const payload = {
    sub: user.id,
    username: user.username,
    email: user.email,
  };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: jwtConstants.accessSecret,
      expiresIn: '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: jwtConstants.refreshSecret,
      expiresIn: '7d',
      jwtid: randomUUID(),
    }),
  ]);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

// refreshToken func
  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: jwtConstants.refreshSecret
        }
      )
      return this.generateTokens({
        id: payload.sub,
        username: payload.username,
        email: payload.email,
      });
    } catch (error) {
      throw new UnauthorizedException('invalid refresh token')
    }
  }
  async signIn(authDto: signInDto) {
    //

    const user = await this.userServ.findUser(authDto.email);
    if (!user) {
      throw new UnauthorizedException();
    }

    const hashCompare = await bcrypt.compare(authDto.password, user.password);

    if (!hashCompare) {
      throw new UnauthorizedException();
    }

    return this.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
    })
  }

  // signUp func
  async signUp(dto: signUpDto) {
    const user = await this.userServ.findUser(dto.email);
    if (user) {
      throw new ConflictException('Email already registered');
    }

    const newUser = await this.userServ.newUser(dto);

    return this.generateTokens({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    })
  }
}
