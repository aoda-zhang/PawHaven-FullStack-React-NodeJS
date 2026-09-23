import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import {
  RenderPdfBodySchema,
  type RenderPdfBody,
} from '@pawhaven/backend-core/types';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';

import { PdfPayloadSizeGuard } from './pdfPayloadSize.guard.js';
import { PdfService } from './pdf.service.js';
import { resolveRequestLocale } from './engine/locale.js';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly config: ConfigService,
  ) {}

  @OptionalAuth()
  @Post('download')
  @UseGuards(PdfPayloadSizeGuard)
  async downloadPdf(
    @Body({ schema: RenderPdfBodySchema }) body: RenderPdfBody,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ) {
    const pdf = await this.pdfService.renderPdf(
      body,
      resolveRequestLocale(headers),
    );
    res.set({
      [httpHeaders.contentType]: 'application/pdf',
      'Content-Length': String(pdf.byteLength),
    });
    res.end(pdf);
  }

  @Post('preview')
  @UseGuards(PdfPayloadSizeGuard)
  async previewPdf(
    @Body({ schema: RenderPdfBodySchema }) body: RenderPdfBody,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ) {
    if (this.config.get<string>('http.env') === 'prod') {
      throw new BadRequestException('Forbidden request!');
    }

    const pdf = await this.pdfService.renderPdf(
      body,
      resolveRequestLocale(headers),
    );
    res.set({
      [httpHeaders.contentType]: 'application/pdf',
      'Content-Length': String(pdf.byteLength),
    });
    res.end(pdf);
  }
}
