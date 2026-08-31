import { localeCodes } from '@pawhaven/shared';

import { storageTool } from '../storage/storageTool';

/**
 * Determines the user's preferred locale by checking (in order):
 * 1. Previously saved locale from localStorage
 * 2. Browser language if it's in the supported languages list
 * 3. Default language fallback
 *
 * @param defaultLanguage - The fallback locale to use (defaults to 'en-US')
 * @param supportLanguages - Array of supported locale codes
 * @returns The resolved locale string
 */
export const getLocale = (
  defaultLanguage: string = localeCodes['en-US'],
  supportLanguages: string[] = [],
) => {
  const currentBrowserLanguage =
    typeof window !== 'undefined' ? window.navigator.language : '';
  const choosedLanguage = storageTool.get<string>('i18nextLng');
  if (choosedLanguage) {
    return choosedLanguage;
  }

  if (
    currentBrowserLanguage &&
    supportLanguages.includes(currentBrowserLanguage)
  ) {
    return currentBrowserLanguage;
  }

  return defaultLanguage;
};
