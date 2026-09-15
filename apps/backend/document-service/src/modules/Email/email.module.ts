import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { EmailController } from './email.controller.js';
import { EmailService } from './email.service.js';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: DBCollection.HISTORY, schema: HistorySchema }]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configs: ConfigService) => ({
        transport: {
          host: configs.get('email')?.host ?? '',
          port: configs.get('email')?.port ?? '',
          secureConnection: false,
          auth: {
            user: configs.get('email')?.user ?? '',
            pass: configs.get('email')?.password ?? '',
          },
          tls: {
            ciphers: configs.get('email')?.tls?.ciphers ?? '',
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
