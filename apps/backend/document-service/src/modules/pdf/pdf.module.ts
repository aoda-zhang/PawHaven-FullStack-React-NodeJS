import { Module } from '@nestjs/common';

import { PdfController } from './pdf.controller.js';
import { PdfService } from './pdf.service.js';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PDFModule {}
