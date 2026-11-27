import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { AuthController } from './auth.controller.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.accessSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy,],
})
export class AuthModule {}

