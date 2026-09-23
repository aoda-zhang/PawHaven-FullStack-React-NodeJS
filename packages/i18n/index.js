import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

import { supportedLngs } from './supportedLngs';

const cookieExpirationDays = 365;
const hoursPerDay = 24;
const minutesPerHour = 60;
const cookieMinutes = cookieExpirationDays * hoursPerDay * minutesPerHour;

const localeFilePattern = /^\.\/locales\/([^/]+)\//;

const localeLoaders = {};
Object.entries(import.meta.glob('./locales/*/*.json')).forEach(
  ([modulePath, loadModule]) => {
    const locale = modulePath.match(localeFilePattern)?.[1];
    if (!locale) return;
    (localeLoaders[locale] ??= []).push(loadModule);
  },
);

const loadLocaleResources = async (locale) => {
  const loaders = localeLoaders[locale] ?? [];
  const loadedFiles = await Promise.all(
    loaders.map((loadModule) => loadModule()),
  );

  return Object.assign({}, ...loadedFiles.map((module) => module.default));
};

i18n
  .use(LanguageDetector)
  .use(resourcesToBackend((locale) => loadLocaleResources(locale)))
  .use(initReactI18next)
  .init({
    supportedLngs,
    fallbackLng: {
      default: ['en-US'],
      'zh-CN': ['zh-CN'],
      'de-DE': ['de-DE'],
    },
    preload: ['en-US'],

    interpolation: {
      escapeValue: false,
      skipOnVariables: false,
    },

    returnObjects: true,

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      cookieMinutes,
    },

    debug: false,
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  });

export { i18n };
