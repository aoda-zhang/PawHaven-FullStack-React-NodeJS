import { storageTool } from '@pawhaven/frontend-core';

import { StorageKeys } from '@/shared/constants/storageKeys';

/**
 * The identity hint the portal keeps on the device so the first paint can show
 * the signed-in shell without a boot round-trip.
 *
 * It is not a credential and it is not the authority: the session lives in an
 * httpOnly cookie, and `/auth/me` decides whether the hint was telling the
 * truth. It carries the id the bootstrap cache key needs plus the moment it
 * stops being worth reading.
 */
export interface StoredSession {
  userId: string;
  expiresAt: number;
}

const MS_PER_SECOND = 1000;

const isStoredSession = (value: unknown): value is StoredSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const { userId, expiresAt } = value as Partial<StoredSession>;

  return (
    typeof userId === 'string' &&
    userId !== '' &&
    typeof expiresAt === 'number' &&
    Number.isFinite(expiresAt)
  );
};

export const clearStoredSession = (): void => {
  storageTool.remove(StorageKeys.userInfo);
};

/**
 * Reads the hint and discards it when it is unreadable or past its expiry.
 *
 * Anything older than this shape — a snapshot without `expiresAt` — counts as
 * expired, so a stale record from a previous release cannot keep the shell
 * signed in.
 */
export const readStoredSession = (
  now: number = Date.now(),
): StoredSession | null => {
  const stored = storageTool.get<unknown>(StorageKeys.userInfo);

  if (stored === null) {
    return null;
  }

  if (!isStoredSession(stored) || stored.expiresAt <= now) {
    clearStoredSession();
    return null;
  }

  return stored;
};

export const storeSession = (
  userId: string,
  expiresInSeconds: number,
): StoredSession => {
  const session: StoredSession = {
    userId,
    expiresAt: Date.now() + expiresInSeconds * MS_PER_SECOND,
  };

  storageTool.set(StorageKeys.userInfo, session);

  return session;
};
