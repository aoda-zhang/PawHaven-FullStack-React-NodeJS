import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { PdfService } from './PDF.service';

@Controller('pdfs')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private config: ConfigService,
  ) {}

  @Post('create')
  generatePdf(@Body() body: any) {
    return this.pdfService.generatePDF(body);
  }

  // Only for develop test
  @Post('preview')
  async previewPdf(@Body() payload: any, @Res() res: Response) {
    if (this.config.get('http.env') === 'prod') {
      throw new BadRequestException('Forbidden request!');
    }
    const PDFData = await this.pdfService.generatePDF(payload);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${PDFData?.fileName}`,
    });
    res.end(PDFData?.data);
  }
}
