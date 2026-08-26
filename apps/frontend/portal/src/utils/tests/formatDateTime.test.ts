import { formatDateTime } from '@pawhaven/frontend-core';
import { describe, expect, it } from 'vitest';

process.env.TZ = 'Asia/Shanghai';

const TS = '2026-08-22T10:00:00.000Z';

describe('formatDateTime', () => {
  it('formats zh-CN by default locale style', () => {
    expect(formatDateTime(TS, 'zh-CN')).toBe('2026\u5e748\u670822\u65e5 18:00');
  });

  it('formats en-US by default locale style', () => {
    expect(formatDateTime(TS, 'en-US')).toBe('Aug 22, 2026 6:00 PM');
  });

  it('formats de-DE by default locale style', () => {
    expect(formatDateTime(TS, 'de-DE')).toBe('22. Aug. 2026 18:00');
  });

  it('overrides the locale default with a format string', () => {
    const englishStyle = 'MMM D, YYYY h:mm A';
    expect(formatDateTime(TS, 'zh-CN', englishStyle)).toBe(
      '8\u6708 22, 2026 6:00 \u665a\u4e0a',
    );
    const numeric = 'YYYY-MM-DD HH:mm';
    expect(formatDateTime(TS, 'de-DE', numeric)).toBe('2026-08-22 18:00');
  });

  it('supports localized named formats', () => {
    expect(formatDateTime(TS, 'de-DE', 'LL')).toBe('22. August 2026');
  });

  it('returns empty string for empty input', () => {
    expect(formatDateTime()).toBe('');
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('')).toBe('');
  });

  it('returns the raw value for invalid dates', () => {
    expect(formatDateTime('not-a-date', 'en-US')).toBe('not-a-date');
  });

  it('accepts Date objects and numeric timestamps', () => {
    expect(formatDateTime(new Date(TS), 'en-US')).toBe('Aug 22, 2026 6:00 PM');
    expect(formatDateTime(Date.parse(TS), 'en-US')).toBe(
      'Aug 22, 2026 6:00 PM',
    );
  });
});
