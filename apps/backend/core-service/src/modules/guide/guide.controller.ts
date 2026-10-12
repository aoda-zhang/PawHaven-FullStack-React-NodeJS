import { Body, Controller, Headers, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { httpHeaders } from '@pawhaven/backend-core/constants';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { normalizeLocale, type GuideLocale } from '@pawhaven/shared/types';

import { GuideService } from './guide.service.js';

const firstLocale = (value?: string): string =>
  (value ?? '').split(',')[0]?.trim() ?? '';

@ApiTags('guide')
@Controller('guide')
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  /**
   * Streams a rendered guide PDF to the browser.
   *
   * Uses `@Res()` deliberately: returning the buffer would let the global
   * `HttpSuccessInterceptor` wrap it in the JSON success envelope and destroy
   * the download. `HttpCode(200)` is set because a bare `@Post` would answer
   * 201, which is wrong for a fetch and would break the client's blob handling.
   */
  @Post('pdf')
  @HttpCode(200)
  @OptionalAuth()
  @ApiOperation({ summary: 'Download a rendered rescue guide as PDF' })
  async downloadPdf(
    @Body('template') template: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ): Promise<void> {
    // The guide slug is validated by `GuideService` against the shared
    // catalogue, so an unknown template cannot reach the renderer.
    const locale = normalizeLocale(
      firstLocale(headers[httpHeaders.appLocale] as string | undefined),
    );
    const pdf = await this.guideService.renderGuidePdf(
      template,
      locale as GuideLocale,
    );

    res.set({
      [httpHeaders.contentType]: 'application/pdf',
      'Content-Length': String(pdf.byteLength),
    });
    res.end(pdf);
  }
}
