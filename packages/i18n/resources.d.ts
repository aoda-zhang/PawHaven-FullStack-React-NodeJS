import type { i18n } from 'i18next';

export declare const documentFallbackLocale: 'en-US';

export declare const translateDocument: (
  locale: string,
  key: string,
  options?: Record<string, unknown>,
) => string;

export declare const getDocumentObject: (
  locale: string,
  key: string,
) => unknown;

export declare const documentI18n: i18n;
