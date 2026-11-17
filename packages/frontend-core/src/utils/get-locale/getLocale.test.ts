import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLocale } from './getLocale';

const stubStorage = (values: Record<string, string>) => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values[key] ?? null,
  });
};

const stubWindow = (language: string) => {
  vi.stubGlobal('window', { navigator: { language } });
};

const SUPPORTED = ['zh-CN', 'en-US', 'de-DE'];

describe('getLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers the stored locale over the browser language', () => {
    stubStorage({ i18nextLng: 'de-DE' });
    stubWindow('zh-CN');

    expect(getLocale('en-US', SUPPORTED)).toBe('de-DE');
  });

  it('uses a supported browser language when nothing is stored', () => {
    stubStorage({});
    stubWindow('zh-CN');

    expect(getLocale('en-US', SUPPORTED)).toBe('zh-CN');
  });

  it('falls back to the default for an unsupported browser language', () => {
    stubStorage({});
    stubWindow('fr-FR');

    expect(getLocale('en-US', SUPPORTED)).toBe('en-US');
  });

  it('returns a custom default when the browser language is unsupported', () => {
    stubStorage({});
    stubWindow('fr-FR');

    expect(getLocale('de-DE', SUPPORTED)).toBe('de-DE');
  });

  it('returns the default when the support list is empty', () => {
    stubStorage({});
    stubWindow('zh-CN');

    expect(getLocale()).toBe('en-US');
  });

  it('returns the default when window is unavailable', () => {
    stubStorage({});

    expect(getLocale('en-US', SUPPORTED)).toBe('en-US');
  });
});
