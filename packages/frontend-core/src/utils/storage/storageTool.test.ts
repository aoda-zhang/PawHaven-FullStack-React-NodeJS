import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { storageTool } from './storageTool';

const KEY = 'pawhaven.test';

class MemoryStorage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const installStorage = () => {
  const persistent = new MemoryStorage();
  const session = new MemoryStorage();
  vi.stubGlobal('localStorage', persistent);
  vi.stubGlobal('sessionStorage', session);
  return { persistent, session };
};

const removeStorage = () => {
  vi.stubGlobal('localStorage', undefined);
  vi.stubGlobal('sessionStorage', undefined);
};

describe('storageTool', () => {
  let persistent: MemoryStorage;

  beforeEach(() => {
    ({ persistent } = installStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round trips a serialized value', () => {
    storageTool.set(KEY, { locale: 'zh-CN', page: 2 });

    expect(storageTool.get(KEY)).toEqual({ locale: 'zh-CN', page: 2 });
  });

  it('returns the raw string when the stored value is not json', () => {
    persistent.setItem(KEY, 'not-json');

    expect(storageTool.get(KEY)).toBe('not-json');
  });

  it('returns null for a missing key', () => {
    expect(storageTool.get(KEY)).toBeNull();
  });

  it('reports key presence', () => {
    expect(storageTool.has(KEY)).toBe(false);

    storageTool.set(KEY, 'value');

    expect(storageTool.has(KEY)).toBe(true);
  });

  it('removes a stored value', () => {
    storageTool.set(KEY, 'value');

    storageTool.remove(KEY);

    expect(storageTool.get(KEY)).toBeNull();
  });

  it('clears both persistent and session storage', () => {
    storageTool.set(KEY, 'persistent');
    sessionStorage.setItem(KEY, 'session');

    storageTool.clearAll();

    expect(persistent.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('degrades to null instead of throwing when storage is unavailable', () => {
    removeStorage();

    expect(storageTool.get(KEY)).toBeNull();
    expect(storageTool.getRaw(KEY)).toBeNull();
    expect(storageTool.has(KEY)).toBe(false);
  });

  it('ignores writes and removals when storage is unavailable', () => {
    removeStorage();

    expect(() => storageTool.set(KEY, 'value')).not.toThrow();
    expect(() => storageTool.remove(KEY)).not.toThrow();
    expect(() => storageTool.clearAll()).not.toThrow();
  });
});
