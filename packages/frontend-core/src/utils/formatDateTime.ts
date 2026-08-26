import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/de';
import 'dayjs/locale/zh-cn';

dayjs.extend(localizedFormat);

const DAYJS_LOCALES: Record<string, string> = {
  'zh-cn': 'zh-cn',
  'en-us': 'en',
  en: 'en',
  'de-de': 'de',
};

const FALLBACK_LOCALE = 'en';
const DEFAULT_FORMAT = 'lll';

export const formatDateTime = (
  value?: string | number | Date | null,
  locale = 'en-US',
  format = '',
): string => {
  if (!value) return '';
  const date = dayjs(value);
  if (!date.isValid()) return String(value);
  const dayjsLocale = DAYJS_LOCALES[locale.toLowerCase()] ?? FALLBACK_LOCALE;
  return date.locale(dayjsLocale).format(format || DEFAULT_FORMAT);
};
