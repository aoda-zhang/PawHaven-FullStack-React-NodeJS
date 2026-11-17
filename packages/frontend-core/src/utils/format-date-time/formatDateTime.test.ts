import { describe, expect, it } from 'vitest';

import { formatDateTime } from './formatDateTime';

describe('formatDateTime', () => {
  it('returns an empty string when there is no value', () => {
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('')).toBe('');
  });

  it('formats with an explicit locale and format', () => {
    expect(formatDateTime('2026-11-17', 'en-US', 'YYYY-MM-DD')).toBe(
      '2026-11-17',
    );
  });

  it('accepts a Date and a numeric timestamp', () => {
    const date = new Date(2026, 10, 17);

    expect(formatDateTime(date, 'en-US', 'YYYY-MM-DD')).toBe('2026-11-17');
    expect(formatDateTime(date.getTime(), 'en-US', 'YYYY-MM-DD')).toBe(
      '2026-11-17',
    );
  });

  it('falls back to the default locale and format', () => {
    const result = formatDateTime('2026-11-17');

    expect(result).toContain('Nov');
    expect(result).toContain('2026');
  });

  it('maps supported locales onto dayjs locales', () => {
    expect(formatDateTime('2026-11-17', 'zh-CN', 'MMMM')).toBe('十一月');
    expect(formatDateTime('2026-03-15', 'de-DE', 'MMMM')).toBe('März');
  });

  it('falls back to english for unsupported locales', () => {
    expect(formatDateTime('2026-03-15', 'fr-FR', 'MMMM')).toBe('March');
  });

  it('matches locales case-insensitively', () => {
    expect(formatDateTime('2026-11-17', 'ZH-cn', 'MMMM')).toBe('十一月');
  });

  it('returns the original string when the date is invalid', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
  });
});
