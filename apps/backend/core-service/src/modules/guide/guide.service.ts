import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpClientService } from '@pawhaven/backend-core';
import {
  httpHeaders,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import type { AxiosResponse } from 'axios';
import { GuideSlugSchema, type GuideLocale } from '@pawhaven/shared/types';

/**
 * Renders the printable rescue guides by delegating to document-service.
 *
 * The portal used to call document-service directly. Routing it through
 * core-service keeps the browser on a single upstream, lets the guide catalogue
 * be validated server-side against `GuideSlugSchema`, and gives the request a
 * real multi-hop trace: gateway -> core-service -> document-service.
 */
@Injectable()
export class GuideService {
  private readonly logger = new Logger(GuideService.name);

  private readonly documentClient = this.httpClientService.create(
    microServiceNames.DOCUMENT,
  );

  constructor(private readonly httpClientService: HttpClientService) {}

  async renderGuidePdf(template: string, locale: GuideLocale): Promise<Buffer> {
    // Validated here rather than only at the edge: this is the boundary the
    // renderer trusts, and `RenderPdfBodySchema` would reject the whole
    // document-service call over one bad slug.
    const slug = GuideSlugSchema.safeParse(template);
    if (!slug.success) {
      throw new BadRequestException('Unknown guide template');
    }

    // `x-locale` is forwarded explicitly because `PdfService` resolves the
    // rendering locale from that header, not from the request body.
    const response = await this.documentClient.post<Buffer>(
      'internal/pdf/render',
      { template: slug.data, locale, data: {} },
      {
        returnResponse: true,
        headers: { [httpHeaders.appLocale]: locale },
        config: { responseType: 'arraybuffer' },
      },
    );

    const body = (response as unknown as AxiosResponse<Buffer>).data;
    if (!Buffer.isBuffer(body)) {
      this.logger.error(
        `document-service returned a non-buffer PDF payload (${typeof body}) for "${template}"`,
      );
      throw new Error('Invalid PDF payload from document-service');
    }

    return body;
  }
}
