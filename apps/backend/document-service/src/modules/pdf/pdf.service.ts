import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import type { Browser } from 'puppeteer';
import type { RenderPdfBody } from '@pawhaven/backend-core/types';
import type { GuideLocale } from '@pawhaven/shared/types';

import { buildPdf } from './engine/pdfBuilder.js';

const DEFAULT_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);

  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  private resolveChromiumExecutablePath(): string | undefined {
    const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (fromEnv) {
      return fromEnv;
    }
    return this.configService.get<string>('pdf.chromiumExecutablePath');
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const envOrConfig = this.resolveChromiumExecutablePath();
    const useServerlessChromium = !envOrConfig && !!process.env.VERCEL;

    const args = useServerlessChromium ? chromium.args : DEFAULT_CHROMIUM_ARGS;

    try {
      this.browser = await puppeteer.launch({
        headless: useServerlessChromium ? 'shell' : true,
        executablePath:
          envOrConfig ??
          (useServerlessChromium ? await chromium.executablePath() : undefined),
        args,
      });
      return this.browser;
    } catch (error) {
      this.browser = null;
      this.logger.error('Failed to launch Chromium for PDF rendering', error);
      throw new Error(
        'Chromium is not available: set PUPPETEER_EXECUTABLE_PATH to a Chromium executable',
      );
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
    const browser = await this.ensureBrowser();

    try {
      return await buildPdf(browser, body, headerLocale);
    } catch (error) {
      this.logger.error(`Failed to render "${body.template}" PDF`, error);
      throw error;
    }
  }
}
