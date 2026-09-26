import { Module } from '@nestjs/common';

import { InternalPdfController } from './internalPdf.controller.js';
import { PdfController } from './pdf.controller.js';
import { PdfService } from './pdf.service.js';

@Module({
  controllers: [PdfController, InternalPdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PDFModule {}
