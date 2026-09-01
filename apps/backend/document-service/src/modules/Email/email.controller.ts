import { Body, Controller, Post } from '@nestjs/common';

import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('/send')
  sendEmail(@Body() emailInfo: any) {
    return this.emailService.sendMail(emailInfo);
  }

  @Post('/preview')
  previewEmail(@Body() emailInfo: any) {
    return this.emailService.getEmailHtml({
      template: emailInfo?.template,
      payload: emailInfo?.payload,
      locale: emailInfo?.locale ?? 'en',
    });
  }
}
