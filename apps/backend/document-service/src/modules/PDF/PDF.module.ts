import { Module } from '@nestjs/common';

import { PdfController } from './PDF.controller.js';
import { PdfService } from './PDF.service.js';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PDFModule {}
