import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module.js';
import { AuthController } from './auth/auth.controller.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq'
import { OutboxPublisherService } from './outbox-publisher/outbox-publisher.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './schedule/scheduler.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OutboxModule } from './outbox-publisher/outbox.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

const config = new ConfigService
config.getOrThrow<string>('RABBIIMQ_URI')
@Module({
  imports: [
    RabbitMQModule.forRoot({
      uri: process.env.RABBIIMQ_URI!,
      exchanges: [
        {
          name: 'notifications_exchange',
          type: 'direct'
        },
      ],
      connectionInitOptions: {
        wait: true, timeout: 10000
      }

    }),
    ScheduleModule.forRoot(),
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'Backend',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    SchedulerModule,
    NotificationsModule,
    OutboxModule,
  ],
  providers: [{
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  }, OutboxPublisherService]
})
export class AppModule {}
