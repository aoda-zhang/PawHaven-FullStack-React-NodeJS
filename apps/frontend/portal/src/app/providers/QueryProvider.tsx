import { getRequestQueryOptions } from '@pawhaven/frontend-core';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

import { routePaths, routeSearchParams } from '@/app/router/routePaths';
import { loadConfig } from '@/config';
import { useIsStableEnv } from '@/shared/hooks/useIsStableEnv';

const FIVE_MINUTES_MS = 300_000;
const THIRTY_MINUTES_MS = 1_800_000;
const TWENTY_FOUR_HOURS_MS = 86_400_000;

let client: QueryClient | null = null;

export const getQueryClient = (): QueryClient => {
  if (client) {
    return client;
  }

  const queryConfig = loadConfig().query;

  client = new QueryClient(
    getRequestQueryOptions({
      refetchOnReconnect: queryConfig?.refetchOnReconnect ?? true,
      refetchOnWindowFocus: queryConfig?.refetchOnWindowFocus ?? false,
      staleTime: queryConfig?.staleTime ?? FIVE_MINUTES_MS,
      gcTime: queryConfig?.gcTime ?? THIRTY_MINUTES_MS,
      onAuthError: () => {
        const { pathname, search } = window.location;
        const isAuthPage =
          pathname === routePaths.login || pathname === routePaths.register;
        if (!isAuthPage) {
          window.location.replace(
            `${routePaths.login}?${routeSearchParams.redirect}=${encodeURIComponent(`${pathname}${search}`)}`,
          );
        }
      },
      onPermissionError: () => {},
    }),
  );

  return client;
};

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const IsStableEnv = useIsStableEnv();
  const queryClient = getQueryClient();
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
        maxAge: TWENTY_FOUR_HOURS_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return query.meta?.persist === true;
          },
        },
      }}
    >
      {children}
      {!IsStableEnv && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </PersistQueryClientProvider>
  );
};
