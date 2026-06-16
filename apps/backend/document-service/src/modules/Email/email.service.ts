import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';

// import EmailPayloadDTO from '@shared/DTO/Document/send-email.DTO'
import i18n from '../../i18n/i18n.config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailService: MailerService,
    private readonly configs: ConfigService,
  ) {}

  async getEmailHtml({
    template,
    payload,
    locale,
  }: {
    template: string;
    payload: Record<string, any>;
    locale: string;
  }) {
    try {
      i18n.setLocale(locale);
      const { default: EmailTemplate } = await import(
        `./templates/${template}`
      );
      return await render(EmailTemplate(payload));
    } catch (error) {
      console.error(error);
      throw new Error(`Failed to get email html with error: ${error}`);
    }
  }

  async sendMail(_userID: string, emailProps: any) {
    try {
      const emailHtml = await this.getEmailHtml({
        template: emailProps?.template,
        payload: emailProps?.payload,
        locale: emailProps?.locale ?? 'en',
      });
      const options: ISendMailOptions = {
        ...(emailProps?.options ?? {}),
        from: this.configs.get('email')?.from,
        html: emailHtml,
      };
      await this.mailService.sendMail(options);
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to send email with error: ${error}`);
    }
  }
}
