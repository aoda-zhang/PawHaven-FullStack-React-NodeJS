import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export const mailTransportProvider: Provider = {
  provide: MAIL_TRANSPORT,
  inject: [ConfigService],
  useFactory: (configs: ConfigService): Transporter => {
    const email = configs.get('email');

    return createTransport({
      host: email?.host ?? '',
      port: Number(email?.port) || undefined,
      secure: false,
      auth: {
        user: email?.user ?? '',
        pass: email?.password ?? '',
      },
      tls: {
        ciphers: email?.tls?.ciphers ?? '',
      },
    });
  },
};
