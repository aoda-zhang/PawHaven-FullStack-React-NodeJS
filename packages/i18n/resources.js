import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createInstance } from 'i18next';

import { supportedLngs } from './supportedLngs.js';

export const documentFallbackLocale = 'en-US';

const DOCUMENTS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'locales',
);

const loadLocaleDocument = (locale) => {
  const document = {};
  const dir = path.join(DOCUMENTS_DIR, locale, 'documents');
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing document locale folder: ${dir}`);
  }
  fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      const kindDir = path.join(dir, entry.name);
      const kind = {};
      fs.readdirSync(kindDir)
        .filter((file) => file.endsWith('.json'))
        .forEach((file) => {
          Object.assign(
            kind,
            JSON.parse(fs.readFileSync(path.join(kindDir, file), 'utf-8')),
          );
        });
      document[entry.name] = kind;
    });
  return { document };
};

const resources = Object.fromEntries(
  supportedLngs.map((locale) => [
    locale,
    { translation: loadLocaleDocument(locale) },
  ]),
);

const instance = createInstance();

instance.init({
  lng: documentFallbackLocale,
  fallbackLng: documentFallbackLocale,
  supportedLngs,
  ns: ['translation'],
  defaultNS: 'translation',
  resources,
  initImmediate: false,
  interpolation: { escapeValue: false },
  returnObjects: false,
});

export const documentI18n = instance;

export const translateDocument = (locale, key, options) =>
  instance.t(`document.${key}`, { ...options, lng: locale });

export const getDocumentObject = (locale, key) =>
  instance.t(`document.${key}`, { lng: locale, returnObjects: true });
