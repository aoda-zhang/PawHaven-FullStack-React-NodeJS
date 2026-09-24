import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import type { Browser } from 'puppeteer';

const DEFAULT_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

export const launchBrowser = async (
  configExecutablePath?: string,
): Promise<Browser> => {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ?? configExecutablePath;
  const useServerlessChromium = !executablePath && !!process.env.VERCEL;
  const args = useServerlessChromium ? chromium.args : DEFAULT_CHROMIUM_ARGS;

  try {
    return await puppeteer.launch({
      headless: useServerlessChromium ? 'shell' : true,
      executablePath:
        executablePath ??
        (useServerlessChromium ? await chromium.executablePath() : undefined),
      args,
    });
  } catch {
    throw new Error(
      'Chromium is not available: set PUPPETEER_EXECUTABLE_PATH to a Chromium executable',
    );
  }
};
