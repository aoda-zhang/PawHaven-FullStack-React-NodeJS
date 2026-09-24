import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import type { SendEmailBody } from '@pawhaven/backend-core/types';
import type { SendMailOptions, Transporter } from 'nodemailer';

import { MAIL_TRANSPORT } from './mailTransport.js';

@Injectable()
export class EmailService {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: Transporter,
    private readonly configs: ConfigService,
  ) {}

  async getEmailHtml({
    template,
    payload,
  }: {
    template: string;
    payload?: Record<string, unknown>;
    locale: string;
  }) {
    try {
      const { default: EmailTemplate } = await import(
        `./templates/${template}`
      );
      return await render(EmailTemplate(payload));
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get email html with error: ${error}`);
    }
  }

  async sendMail(emailProps: SendEmailBody) {
    try {
      const emailHtml = await this.getEmailHtml({
        template: emailProps?.template,
        payload: emailProps?.payload,
        locale: emailProps?.locale ?? 'en-US',
      });
      const options = (emailProps?.options ?? {}) as SendMailOptions;

      await this.transport.sendMail({
        ...options,
        from: this.configs.get('email')?.from,
        html: emailHtml,
      });
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to send email with error: ${error}`);
    }
  }
}
