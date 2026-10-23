import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearStoredSession,
  readStoredSession,
  storeSession,
} from '../sessionHint';

import { createMemoryStorage } from './memoryStorage';

describe('sessionHint — a non-authoritative identity hint', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('stores only the user id, without a client-side expiry', () => {
    storeSession('u-1');

    expect(JSON.parse(localStorage.getItem('userInfo') ?? 'null')).toEqual({
      userId: 'u-1',
    });
  });

  it('reads the hint while the server remains responsible for session validity', () => {
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ userId: 'u-1', expiresAt: Date.now() - 1000 }),
    );

    expect(readStoredSession()).toEqual({ userId: 'u-1' });
    expect(localStorage.getItem('userInfo')).not.toBeNull();
  });

  it('drops a malformed or legacy snapshot without a user id', () => {
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ email: 'a@b.com', status: 'active' }),
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
    storeSession('u-1');

    clearStoredSession();

    expect(localStorage.getItem('userInfo')).toBeNull();
  });
});
