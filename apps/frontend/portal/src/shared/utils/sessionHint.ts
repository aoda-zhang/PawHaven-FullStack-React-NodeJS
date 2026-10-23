import { storageTool } from '@pawhaven/frontend-core';

import { StorageKeys } from '@/shared/constants/storageKeys';

/**
 * A non-authoritative identity hint used to initialize the signed-in shell.
 * The backend session in HttpOnly cookies remains the source of truth.
 */
export interface StoredSession {
  userId: string;
}

const isStoredSession = (value: unknown): value is StoredSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const { userId } = value as Partial<StoredSession>;

  return typeof userId === 'string' && userId !== '';
};

export const clearStoredSession = (): void => {
  storageTool.remove(StorageKeys.userInfo);
};

export const readStoredSession = (): StoredSession | null => {
  const stored = storageTool.get<unknown>(StorageKeys.userInfo);

  if (!isStoredSession(stored)) {
    if (stored !== null) {
      clearStoredSession();
    }
    return null;
  }

  return { userId: stored.userId };
};

export const storeSession = (userId: string): StoredSession => {
  const session: StoredSession = { userId };

  storageTool.set(StorageKeys.userInfo, session);

  return session;
};
