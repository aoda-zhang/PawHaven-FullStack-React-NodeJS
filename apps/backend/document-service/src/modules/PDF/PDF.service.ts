import * as fs from 'fs';
import * as path from 'path';

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import puppeteer, { Browser, PDFOptions } from 'puppeteer';

import i18n from '../../i18n/i18n.config';

interface GetHTMLContentParams {
  template: string;
  PDFData?: Record<string, unknown>;
}

interface GeneratePDFPayload {
  template: string;
  locale: string;
  PDFContentData?: Record<string, unknown>;
  PDFHeaderData?: Record<string, unknown>;
  PDFFooterData?: Record<string, unknown>;
  PDFOptions?: PDFOptions;
}

interface HeaderFooterResult {
  headerTemplate: string;
  footerTemplate: string;
}

@Injectable()
export class PdfService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;

  constructor() {}

  async onModuleInit() {
    try {
      // Force Puppeteer to install or locate Chromium
      // await puppeteer.createBrowserFetcher().download(puppeteer.executableRevision());
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      // this.browser = await puppeteer.launch();
    } catch (error) {
      console.error('Puppeteer bootstrap failed:', error);
      throw new Error('Puppeteer failed to bootstrap Chromium');
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async getHTMLContent({
    template,
    PDFData = {},
  }: GetHTMLContentParams): Promise<string> {
    try {
      const { default: TemplateComponent } = await import(
        `./templates/${template}/index.tsx`
      );

      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        React.createElement(TemplateComponent, PDFData),
      );

      const cssFilePath = path.resolve(
        __dirname,
        `./templates/${template}/index.css`,
      );

      let cssContent = '';

      if (fs.existsSync(cssFilePath)) {
        cssContent = fs.readFileSync(cssFilePath, 'utf8');
      }

      return `
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <style>
              ${cssContent}
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;
    } catch (error) {
      console.error(error);
      throw new Error(
        `get the ${template} with error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getHeaderFooter(
    payload: GeneratePDFPayload,
  ): Promise<HeaderFooterResult> {
    // const headerLogo = await convertImageToBase64(this.configService.get('PDF.headerLogo'))
    const headerTemplate = await this.getHTMLContent({
      template: 'common_header',
      PDFData: { ...(payload?.PDFHeaderData ?? {}) },
      // PDFData: { logoUrl: headerLogo, ...(payload?.PDFHeaderData ?? {}) }
    });
    const footerTemplate = await this.getHTMLContent({
      template: 'common_footer',
      PDFData: { ...(payload?.PDFFooterData ?? {}) },
    });
    return {
      headerTemplate,
      footerTemplate,
    };
  }

  async getPDFSettings(payload: GeneratePDFPayload): Promise<PDFOptions> {
    try {
      const headerFooter = await this.getHeaderFooter(payload);
      const defaultOptions: PDFOptions = {
        format: 'A4',
        margin: {
          top: '120px',
          bottom: '120px',
          left: '40px',
          right: '40px',
        },
        displayHeaderFooter: true,
        preferCSSPageSize: true,
        headerTemplate: headerFooter?.headerTemplate,
        footerTemplate: headerFooter?.footerTemplate,
      };

      return {
        ...defaultOptions,
        ...(payload?.PDFOptions ?? {}),
        headerTemplate: headerFooter?.headerTemplate,
        footerTemplate: headerFooter?.footerTemplate,
      };
    } catch (error) {
      console.error(error);
      throw new Error(
        `get PDF settings with error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async generatePDF(
    payload: GeneratePDFPayload,
  ): Promise<{ data: Buffer; fileName: string }> {
    try {
      // Set locale for PDF content to translate
      const locale = payload?.locale ?? 'en';
      i18n.setLocale(locale);

      if (!this.browser) {
        throw new Error('Puppeteer browser is not initialized');
      }
      const page = await this.browser.newPage();

      const PDFMainContent = await this.getHTMLContent({
        template: payload?.template,
        PDFData: payload?.PDFContentData,
      });
      await page.setContent(PDFMainContent, {
        waitUntil: ['networkidle2', 'domcontentloaded'],
      });
      const PDFSettings = await this.getPDFSettings(payload);
      const PDFBuffer = await page.pdf(PDFSettings);
      await page.close();

      return {
        data: Buffer.from(PDFBuffer),
        fileName: this.generatePDFFileName(payload),
      };
    } catch (error) {
      console.error(error);
      throw new Error(
        `${payload?.template} generate PDF with error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  generatePDFFileName(payload: Pick<GeneratePDFPayload, 'template'>): string {
    return `${payload?.template}-${Date.now()}.pdf`;
  }
}
