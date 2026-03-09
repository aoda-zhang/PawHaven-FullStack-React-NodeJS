import { Body, Controller, Post, Req } from '@nestjs/common';
// import EmailPayloadDTO from '@shared/DTO/Document/send-email.DTO';

import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('/send')
  sendEmail(@Req() req: any, @Body() emailInfo: any) {
    const userID = req?.headers?.['x-auth-user-id'] || req?.user?.userId;
    return this.emailService.sendMail(userID, emailInfo);
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
