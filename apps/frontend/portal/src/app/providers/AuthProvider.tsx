import { storageTool } from '@pawhaven/frontend-core';
import type { AuthUser, CredentialsDto } from '@pawhaven/shared/types';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

import { useLogin, useLogout } from '@/pages/auth/api/auth.mutations';
import { StorageKeys } from '@/shared/constants/storageKeys';

interface AuthCallbacks {
  onSuccess?: () => void;
  onError?: () => void;
}

interface AuthContextType {
  userInfo: AuthUser | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (credentials: CredentialsDto, callbacks?: AuthCallbacks) => void;
  logout: (callbacks?: AuthCallbacks) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUserInfo = (): AuthUser | null => {
  const stored = storageTool.get<AuthUser>(StorageKeys.userInfo);
  return stored && typeof stored === 'object' ? stored : null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<AuthUser | null>(readStoredUserInfo);

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const storeUserInfo = useCallback((nextUserInfo: AuthUser | null) => {
    setUserInfo(nextUserInfo);
    if (nextUserInfo) {
      storageTool.set(StorageKeys.userInfo, nextUserInfo);
      return;
    }
    storageTool.remove(StorageKeys.userInfo);
  }, []);

  const login = useCallback(
    (credentials: CredentialsDto, callbacks?: AuthCallbacks) => {
      loginMutation.mutate(credentials, {
        onSuccess: (session) => {
          storeUserInfo(session.user);
          callbacks?.onSuccess?.();
        },
        onError: callbacks?.onError,
      });
    },
    [loginMutation, storeUserInfo],
  );

  const logout = useCallback(
    (callbacks?: AuthCallbacks) => {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          storeUserInfo(null);
          callbacks?.onSuccess?.();
        },
        onError: callbacks?.onError,
      });
    },
    [logoutMutation, storeUserInfo],
  );

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        isAuthenticated: !!userInfo,
        isPending: loginMutation.isPending || logoutMutation.isPending,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
