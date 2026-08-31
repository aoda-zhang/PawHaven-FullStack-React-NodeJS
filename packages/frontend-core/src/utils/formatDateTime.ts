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

/**
 * Formats a date/time value into a localized string.
 * Returns empty string if value is falsy, or the original value as string if invalid.
 *
 * @param value - The date value to format (string, number, Date, or null/undefined)
 * @param locale - The locale code (e.g., 'en-US', 'zh-CN', 'de-DE'). Defaults to 'en-US'
 * @param format - Optional dayjs format string. Defaults to 'lll' (localized long format)
 * @returns The formatted date string, empty string if no value, or original value if invalid
 */
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
