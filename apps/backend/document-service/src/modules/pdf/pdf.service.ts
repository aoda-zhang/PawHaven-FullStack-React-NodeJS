import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import type { RenderPdfBody } from '@pawhaven/backend-core/types';
import type { GuideLocale } from '@pawhaven/shared/types';

import { buildPdf } from './engine/pdfBuilder.js';

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);

  private browser: Browser | null = null;

  async onModuleInit(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    } catch (error) {
      this.logger.error('Puppeteer bootstrap failed', error);
      throw new Error('Puppeteer failed to bootstrap Chromium');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async renderPdf(
    body: RenderPdfBody,
    headerLocale: GuideLocale,
  ): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('Puppeteer browser is not initialized');
    }

    try {
      return await buildPdf(this.browser, body, headerLocale);
    } catch (error) {
      this.logger.error(`Failed to render "${body.template}" PDF`, error);
      throw new Error(
        `${body.template} render PDF with error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
