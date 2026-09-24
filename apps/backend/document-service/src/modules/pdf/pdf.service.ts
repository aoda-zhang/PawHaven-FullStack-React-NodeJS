import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Browser } from 'puppeteer';
import type { RenderPdfBody } from '@pawhaven/backend-core/types';
import type { GuideLocale } from '@pawhaven/shared/types';

import { buildPdf } from './engine/pdfBuilder.js';
import { launchBrowser } from './engine/launchBrowser.js';
import './templates/index.js';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);

  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await launchBrowser(
      this.configService.get<string>('pdf.chromiumExecutablePath'),
    );
    return this.browser;
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
    const browser = await this.ensureBrowser();

    try {
      return await buildPdf(browser, body, headerLocale);
    } catch (error) {
      this.logger.error(`Failed to render "${body.template}" PDF`, error);
      throw error;
    }
  }
}
