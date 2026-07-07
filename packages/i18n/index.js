import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { supportedLngs } from './supportedLngs';

i18n
  .use(LanguageDetector)
  .use(
    resourcesToBackend((locale, namespace) => {
      if (namespace && namespace !== 'translation') {
        return import(`./locales/${namespace}/${locale}.json`);
      }
      return import(`./locales/${locale}.json`);
    }),
  )
  .use(initReactI18next)
  .init({
    supportedLngs,
    fallbackLng: {
      default: ['en-US'],
      'zh-CN': ['zh-CN'],
      zh: ['zh-CN'],
      'de-DE': ['de-DE'],
      de: ['de-DE'],
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
      cookieMinutes: 365 * 24 * 60,
    },

    debug: false,
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
  });

export default i18n;
