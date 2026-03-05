import { Module } from '@nestjs/common';

import { PdfController } from './PDF.controller';
import { PdfService } from './PDF.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PDFModule {}
