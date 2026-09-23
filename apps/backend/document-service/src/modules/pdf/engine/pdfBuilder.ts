import * as React from 'react';
import type { ComponentType } from 'react';
import type { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import type { Browser } from 'puppeteer';
import type { GuideLocale, PdfOptions } from '@pawhaven/shared/types';
import type { RenderPdfBody } from '@pawhaven/backend-core/types';
import { documentI18n } from '@pawhaven/i18n/resources';

import { CommonHeader } from '../components/Header.js';
import { CommonFooter } from '../components/Footer.js';
import { getPdfTemplate, renderPdfElement } from '../templates/index.js';

import { documentStyles } from './styles.js';
import {
  defaultPdfOptions,
  type ResolvedPdfOptions,
} from './defaultOptions.js';

const resolvePdfOptions = (options?: PdfOptions): ResolvedPdfOptions => ({
  ...defaultPdfOptions,
  ...options,
  margin: {
    top: options?.margin?.top ?? defaultPdfOptions.margin.top,
    bottom: options?.margin?.bottom ?? defaultPdfOptions.margin.bottom,
    left: options?.margin?.left ?? defaultPdfOptions.margin.left,
    right: options?.margin?.right ?? defaultPdfOptions.margin.right,
  },
});

const buildHtml = (content: string, locale: GuideLocale): string => `
  <!DOCTYPE html>
  <html lang="${locale}">
    <head>
      <meta charset="UTF-8" />
      <style>${documentStyles}</style>
    </head>
    <body>${content}</body>
  </html>
`;

const chromeTemplateStyles = `${documentStyles}
html,
body {
  background: transparent;
}`;

const buildChromeTemplate = (
  instance: i18n,
  Component: ComponentType,
): string =>
  `<style>${chromeTemplateStyles}</style>${renderPdfElement(
    React.createElement(
      I18nextProvider,
      { i18n: instance },
      React.createElement(Component),
    ),
  )}`;

export const buildPdf = async (
  browser: Browser,
  body: RenderPdfBody,
  headerLocale: GuideLocale,
): Promise<Buffer> => {
  const locale = headerLocale;
  const descriptor = getPdfTemplate(body.template);
  const instance = documentI18n.cloneInstance({ lng: locale });
  const page = await browser.newPage();
  try {
    const bodyHtml = renderPdfElement(descriptor.element(instance));
    const headerHtml = buildChromeTemplate(instance, CommonHeader);
    const footerHtml = buildChromeTemplate(instance, CommonFooter);
    const html = buildHtml(bodyHtml, locale);
    await page.setContent(html, { waitUntil: 'load' });

    const buffer = await page.pdf({
      ...resolvePdfOptions(body.options),
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
    });

    return Buffer.from(buffer);
  } finally {
    await page.close();
  }
};
