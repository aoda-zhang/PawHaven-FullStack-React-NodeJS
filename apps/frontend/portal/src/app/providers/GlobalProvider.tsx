import type { CredentialsDto } from '@pawhaven/shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useState, type ReactNode } from 'react';

import { bootstrapQueryOptions } from '@/app/init/bootstrap.queries';
import {
  useLogin,
  useLogout,
  useRegister,
} from '@/pages/auth/api/auth.mutations';
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
  userInfo: StoredSession | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (credentials: CredentialsDto, callbacks?: GlobalCallbacks) => void;
  register: (credentials: CredentialsDto, callbacks?: GlobalCallbacks) => void;
  logout: (callbacks?: GlobalCallbacks) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<StoredSession | null>(
    readStoredSession,
  );
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const completeAuthentication = (
    userId: string,
    callbacks?: GlobalCallbacks,
  ) => {
    setUserInfo(storeSession(userId));
    setIsBootstrapping(true);

    queryClient
      .fetchQuery({
        ...bootstrapQueryOptions({ userID: userId, menuUpdateAt: '' }),
        staleTime: 0,
      })
      .then(() => {
        setIsBootstrapping(false);
        callbacks?.onSuccess?.();
      })
      .catch(() => setIsBootstrapping(false));
  };

  const login = (credentials: CredentialsDto, callbacks?: GlobalCallbacks) => {
    loginMutation.mutate(credentials, {
      onSuccess: (session) => {
        completeAuthentication(session.user.userId, callbacks);
      },
      onError: callbacks?.onError,
    });
  };

  const register = (
    credentials: CredentialsDto,
    callbacks?: GlobalCallbacks,
  ) => {
    registerMutation.mutate(credentials, {
      onSuccess: (session) => {
        completeAuthentication(session.user.userId, callbacks);
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
        userInfo,
        isAuthenticated: !!userInfo,
        isPending:
          loginMutation.isPending ||
          registerMutation.isPending ||
          logoutMutation.isPending ||
          isBootstrapping,
        login,
        register,
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
