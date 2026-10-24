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

  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    if (!this.browserPromise) {
      const launchPromise = launchBrowser(
        this.configService.get<string>('pdf.chromiumExecutablePath'),
      );
      this.browserPromise = launchPromise;
      launchPromise.catch(() => {
        if (this.browserPromise === launchPromise) {
          this.browserPromise = null;
        }
      });
    }

    const launchPromise = this.browserPromise;
    if (!launchPromise) {
      throw new Error('Chromium initialization could not be started');
    }

    this.browser = await launchPromise;
    return this.browser;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browserPromise && !this.browser) {
      try {
        await this.browserPromise;
      } catch {
        // Browser startup failed; there is no process to close.
      }
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.browserPromise = null;
  }

  async renderPdf(
    body: RenderPdfBody,
    headerLocale: GuideLocale,
  ): Promise<Buffer> {
    const startedAt = Date.now();
    const browserStartedAt = Date.now();

    try {
      const browser = await this.ensureBrowser();
      const browserReadyMs = Date.now() - browserStartedAt;
      const renderStartedAt = Date.now();
      const pdf = await buildPdf(browser, body, headerLocale);
      const renderMs = Date.now() - renderStartedAt;
      this.logger.log(
        `Rendered PDF template "${body.template}" (browserReadyMs=${browserReadyMs}, renderMs=${renderMs}, totalMs=${Date.now() - startedAt}, bytes=${pdf.byteLength})`,
      );
      return pdf;
    } catch (error) {
      this.logger.error(
        `Failed to render "${body.template}" PDF (totalMs=${Date.now() - startedAt})`,
        error,
      );
      throw error;
    }
  }
}
