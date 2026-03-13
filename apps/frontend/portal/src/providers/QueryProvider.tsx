import { getRequestQueryOptions } from '@pawhaven/frontend-core';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

import { loadConfig } from '../config';

import { useIsStableEnv } from '@/hooks/useIsStableEnv';

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const IsStableEnv = useIsStableEnv();
  const [queryClient] = useState(
    () =>
      new QueryClient(
        getRequestQueryOptions({
          refetchOnReconnect: loadConfig().query?.refetchOnReconnect ?? true,
          refetchOnWindowFocus:
            loadConfig().query?.refetchOnWindowFocus ?? false,
          staleTime: Number(loadConfig().query?.staleTime) ?? 5 * 60 * 1000,
          cacheTime: Number(loadConfig().query?.cacheTime) ?? 30 * 60 * 1000,
          onAuthError: () => {
            // Backend/gateway 401 -> hard redirect to reset app state and enter login flow
            window.location.href = '/auth/login';
          },
          onPermissionError: () => {},
        }),
      ),
  );

  const [asyncStoragePersister] = useState(() =>
    createAsyncStoragePersister({
      storage: window.localStorage,
      key: 'PAWHAVEN_DATA_PERSIST',
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return query.meta?.persist === true;
          },
        },
      }}
    >
      {children}
      {!IsStableEnv && <ReactQueryDevtools initialIsOpen />}
    </PersistQueryClientProvider>
  );
};
