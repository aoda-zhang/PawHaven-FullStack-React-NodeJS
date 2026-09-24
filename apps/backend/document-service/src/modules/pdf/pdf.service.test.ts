import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'puppeteer';
import type { ConfigService } from '@nestjs/config';
import type { GuideLocale } from '@pawhaven/shared/types';
import type { RenderPdfBody } from '@pawhaven/backend-core/types';

import { PdfService } from './pdf.service.js';

const { launchMock, buildPdfMock, executablePathMock } = vi.hoisted(() => ({
  launchMock: vi.fn(),
  buildPdfMock: vi.fn(),
  executablePathMock: vi.fn(),
}));

vi.mock('puppeteer', () => ({
  default: { launch: launchMock },
}));

vi.mock('@sparticuz/chromium-min', () => ({
  default: {
    executablePath: executablePathMock,
    args: ['--sparticuz-arg'],
  },
}));

vi.mock('./engine/pdfBuilder.js', () => ({
  buildPdf: buildPdfMock,
}));

const browser = {} as unknown as Browser;
const body = { template: 'guide' } as unknown as RenderPdfBody;
const locale = 'en-US' as GuideLocale;

const DEFAULT_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

const buildService = (
  configGet: (key: string) => unknown = () => undefined,
): PdfService => new PdfService({ get: configGet } as unknown as ConfigService);

beforeEach(() => {
  launchMock.mockReset();
  buildPdfMock.mockReset();
  executablePathMock.mockReset();
  launchMock.mockResolvedValue(browser);
  buildPdfMock.mockResolvedValue(Buffer.from('pdf'));
  executablePathMock.mockResolvedValue('/sparticuz/chromium');
  delete process.env.PUPPETEER_EXECUTABLE_PATH;
  delete process.env.VERCEL;
});

afterEach(() => {
  delete process.env.PUPPETEER_EXECUTABLE_PATH;
  delete process.env.VERCEL;
});

describe('PdfService Chromium executable path resolution', () => {
  it('prefers PUPPETEER_EXECUTABLE_PATH over config and @sparticuz/chromium-min (env wins)', async () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/env/chromium';
    const service = buildService(() => '/config/chromium');

    await service.renderPdf(body, locale);

    expect(executablePathMock).not.toHaveBeenCalled();
    const options = launchMock.mock.calls[0][0];
    expect(options.executablePath).toBe('/env/chromium');
    expect(options.args).toEqual(DEFAULT_CHROMIUM_ARGS);
    expect(options.headless).toBe(true);
  });

  it('falls back to pdf.chromiumExecutablePath config when the env var is unset', async () => {
    const service = buildService((key) =>
      key === 'pdf.chromiumExecutablePath' ? '/config/chromium' : undefined,
    );

    await service.renderPdf(body, locale);

    expect(executablePathMock).not.toHaveBeenCalled();
    const options = launchMock.mock.calls[0][0];
    expect(options.executablePath).toBe('/config/chromium');
    expect(options.args).toEqual(DEFAULT_CHROMIUM_ARGS);
    expect(options.headless).toBe(true);
  });

  it('uses @sparticuz/chromium-min on Vercel when neither env var nor config is set', async () => {
    process.env.VERCEL = '1';
    await buildService().renderPdf(body, locale);

    expect(executablePathMock).toHaveBeenCalledTimes(1);
    const options = launchMock.mock.calls[0][0];
    expect(options.executablePath).toBe('/sparticuz/chromium');
    expect(options.args).toEqual(['--sparticuz-arg']);
    expect(options.headless).toBe('shell');
  });
});

describe('PdfService lazy browser initialization', () => {
  it('does not launch the browser until renderPdf is called', async () => {
    const service = buildService();

    expect(launchMock).not.toHaveBeenCalled();

    await service.renderPdf(body, locale);

    expect(launchMock).toHaveBeenCalledTimes(1);
  });

  it('reuses the launched browser across multiple renderPdf calls', async () => {
    const service = buildService();

    await service.renderPdf(body, locale);
    await service.renderPdf(body, locale);

    expect(launchMock).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when Chromium cannot be launched', async () => {
    launchMock.mockRejectedValueOnce(new Error('spawn ENOENT'));

    await expect(buildService().renderPdf(body, locale)).rejects.toThrow(
      /Chromium is not available/,
    );
  });
});
