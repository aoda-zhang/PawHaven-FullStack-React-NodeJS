import { join } from 'node:path';

import i18n from 'i18n';

i18n.configure({
  locales: ['en', 'zh'], // List of supported languages
  directory: join(__dirname, '.'), // Path to translation files
  defaultLocale: 'en', // Default language
  autoReload: false, // Disabled: do not automatically reload translation files
  updateFiles: false, // Prevents automatic creation of missing translation files
  syncFiles: false, // Disables synchronization of locale files
});

// eslint-disable-next-line import/no-default-export
export default i18n;
