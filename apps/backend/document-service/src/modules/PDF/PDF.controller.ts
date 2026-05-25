import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { PdfService } from './PDF.service';

@Controller('document')
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

  @Get('rescue/guide')
  async getRescueGuidePdf(
    @Headers('accept-language') acceptLanguage: string,
    @Res() res: Response,
  ) {
    const locale = acceptLanguage?.startsWith('zh') ? 'zh' : 'en';
    const PDFData = await this.pdfService.generatePDF({
      template: 'rescue_guide',
      locale,
    });
    const filename = `PawHaven-Rescue-Guide-${locale.toUpperCase()}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=86400',
      Vary: 'Accept-Language',
    });
    res.end(PDFData?.data);
  }
}
