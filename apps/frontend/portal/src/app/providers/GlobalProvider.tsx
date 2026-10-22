import type { CredentialsDto } from '@pawhaven/shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { bootstrapQueryOptions } from '@/app/init/bootstrap.queries';
import { useLogin, useLogout } from '@/pages/auth/api/auth.mutations';
import {
  clearStoredSession,
  readStoredSession,
  storeSession,
  type StoredSession,
} from '@/shared/utils/sessionHint';

interface GlobalCallbacks {
  onSuccess?: () => void;
  onError?: () => void;
}

interface GlobalContextType {
  locale: string;
  setLocale: (locale: string) => void;
  userInfo: StoredSession | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (credentials: CredentialsDto, callbacks?: GlobalCallbacks) => void;
  logout: (callbacks?: GlobalCallbacks) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const [userInfo, setUserInfo] = useState<StoredSession | null>(
    readStoredSession,
  );

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const setLocale = (locale: string) => {
    i18n.changeLanguage(locale).catch(() => undefined);
  };

  const queryClient = useQueryClient();
  const login = (credentials: CredentialsDto, callbacks?: GlobalCallbacks) => {
    loginMutation.mutate(credentials, {
      onSuccess: (session) => {
        setUserInfo(storeSession(session.user.userId, session.expires_in));
        queryClient.prefetchQuery(
          bootstrapQueryOptions({
            userID: session.user.userId,
            menuUpdateAt: '',
          }),
        );
        callbacks?.onSuccess?.();
      },
      onError: callbacks?.onError,
    });
  };

  const logout = (callbacks?: GlobalCallbacks) => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearStoredSession();
        setUserInfo(null);
        callbacks?.onSuccess?.();
      },
      onError: callbacks?.onError,
    });
  };

  return (
    <GlobalContext.Provider
      value={{
        locale: i18n.language,
        setLocale,
        userInfo,
        isAuthenticated: !!userInfo,
        isPending: loginMutation.isPending || logoutMutation.isPending,
        login,
        logout,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};
