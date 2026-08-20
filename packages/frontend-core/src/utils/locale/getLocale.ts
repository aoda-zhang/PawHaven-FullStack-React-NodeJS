import { localeCodes } from '@pawhaven/shared';

import { storageTool } from '../storage/storageTool';

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
