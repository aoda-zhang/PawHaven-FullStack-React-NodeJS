import { Module } from '@nestjs/common';

import { EmailController } from './email.controller.js';
import { EmailService } from './email.service.js';
import { mailTransportProvider } from './mailTransport.js';

@Module({
  controllers: [EmailController],
  providers: [mailTransportProvider, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
