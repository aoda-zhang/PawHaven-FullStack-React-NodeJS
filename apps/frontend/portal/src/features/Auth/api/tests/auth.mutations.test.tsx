import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useLogin, useLogout } from '../auth.mutations';
import { authQueryKeys } from '../auth.queryKeys';

import { landingQueryKeys } from '@/features/Landing/api/landing.queryKeys';

// Mock API calls.
vi.mock('../auth.api', () => ({
  postLogin: vi.fn().mockResolvedValue({ accessToken: 'test-token' }),
  deleteLogout: vi.fn().mockResolvedValue(undefined),
  postRegister: vi.fn(),
}));

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'AuthMutationTestWrapper';
  return Wrapper;
};

describe('Auth mutations — bootstrap invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // Pre-populate cache with bootstrap and auth queries.
    queryClient.setQueryData(landingQueryKeys.all, { menus: [], routers: [] });
    queryClient.setQueryData(authQueryKeys.all, { user: null });
  });

  it('login onSuccess invalidates both auth and landing bootstrap queries', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@test.com',
        password: 'x',
      });
    });

    // Both queries should be marked stale after invalidation.
    const authState = queryClient.getQueryState(authQueryKeys.all);
    const landingState = queryClient.getQueryState(landingQueryKeys.all);

    expect(authState?.isInvalidated).toBe(true);
    expect(landingState?.isInvalidated).toBe(true);
  });

  it('logout onSuccess invalidates both auth and landing bootstrap queries', async () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    const authState = queryClient.getQueryState(authQueryKeys.all);
    const landingState = queryClient.getQueryState(landingQueryKeys.all);

    expect(authState?.isInvalidated).toBe(true);
    expect(landingState?.isInvalidated).toBe(true);
  });
});
