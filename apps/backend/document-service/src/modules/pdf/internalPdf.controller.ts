import {
  Body,
  Controller,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import {
  RenderPdfBodySchema,
  type RenderPdfBody,
} from '@pawhaven/backend-core/types';

import { PdfPayloadSizeGuard } from './pdfPayloadSize.guard.js';
import { PdfService } from './pdf.service.js';
import { resolveRequestLocale } from './engine/locale.js';

/**
 * Server-to-server PDF rendering, for callers inside the cluster.
 *
 * Deliberately separate from the public `PdfController`: this route carries no
 * `@Public()`, so the global `InternalJwtGuard` rejects anonymous callers, and
 * the gateway refuses to proxy any path that rewrites to `/internal`
 * (`proxy.service.ts` `assertSafePath`). The pair is what keeps the public PDF
 * surface and the internal one from drifting into each other.
 *
 * The response is written with `@Res()` rather than returned, because the
 * global `HttpSuccessInterceptor` would otherwise wrap the PDF buffer in the
 * JSON success envelope and corrupt the download.
 */
@Controller('internal/pdf')
@UseGuards(PdfPayloadSizeGuard)
export class InternalPdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('render')
  async render(
    @Body({ schema: RenderPdfBodySchema }) body: RenderPdfBody,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ): Promise<void> {
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
