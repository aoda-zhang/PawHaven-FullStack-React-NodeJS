import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearStoredSession,
  readStoredSession,
  storeSession,
} from '../sessionHint';

import { createMemoryStorage } from './memoryStorage';

describe('sessionHint — what the device keeps so the first paint knows the user', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('stamps the hint with the lifetime the server granted', () => {
    const before = Date.now();

    storeSession('u-1', 900);

    const stored = JSON.parse(localStorage.getItem('userInfo') ?? 'null');

    expect(stored.userId).toBe('u-1');
    expect(stored.expiresAt).toBeGreaterThanOrEqual(before + 900_000);
    expect(stored.expiresAt).toBeLessThanOrEqual(Date.now() + 900_000);
  });

  it('returns the hint while it is still within its lifetime', () => {
    storeSession('u-1', 900);

    expect(readStoredSession()?.userId).toBe('u-1');
    expect(localStorage.getItem('userInfo')).not.toBeNull();
  });

  it('drops the hint once its lifetime has passed', () => {
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ userId: 'u-1', expiresAt: Date.now() - 1000 }),
    );

    expect(readStoredSession()).toBeNull();
    expect(localStorage.getItem('userInfo')).toBeNull();
  });

  it('drops a hint written by an older release, which has no lifetime', () => {
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ userId: 'u-1', email: 'a@b.com', status: 'active' }),
    );

    expect(readStoredSession()).toBeNull();
    expect(localStorage.getItem('userInfo')).toBeNull();
  });

  it('drops unreadable values instead of trusting them', () => {
    localStorage.setItem('userInfo', 'not-json');

    expect(readStoredSession()).toBeNull();
    expect(localStorage.getItem('userInfo')).toBeNull();
  });

  it('reads nothing when the device holds no hint', () => {
    expect(readStoredSession()).toBeNull();
  });

  it('clears the hint on demand', () => {
    storeSession('u-1', 900);

    clearStoredSession();

    expect(localStorage.getItem('userInfo')).toBeNull();
  });
});
