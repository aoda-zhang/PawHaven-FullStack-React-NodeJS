import { Body, Controller, Post } from '@nestjs/common';
import {
  PreviewEmailBodySchema,
  SendEmailBodySchema,
  type PreviewEmailBody,
  type SendEmailBody,
} from '@pawhaven/backend-core/types';

import { EmailService } from './email.service.js';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('/send')
  sendEmail(@Body({ schema: SendEmailBodySchema }) emailInfo: SendEmailBody) {
    return this.emailService.sendMail(emailInfo);
  }

  @Post('/preview')
  previewEmail(
    @Body({ schema: PreviewEmailBodySchema }) emailInfo: PreviewEmailBody,
  ) {
    return this.emailService.getEmailHtml({
      template: emailInfo.template,
      payload: emailInfo.payload,
      locale: emailInfo.locale,
    });
  }
}
