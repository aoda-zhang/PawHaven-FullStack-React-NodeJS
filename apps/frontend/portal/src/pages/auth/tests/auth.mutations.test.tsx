import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useLogin, useLogout } from '../api/auth.mutations';

import { bootstrapQueryKeys } from '@/app/init/bootstrap.queryKeys';
import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

// Mock API calls.
vi.mock('../api/auth.api', () => ({
  postLogin: vi.fn().mockResolvedValue({
    user: { userId: 'u-123', email: 'test@test.com', roles: [] },
    expires_in: 900,
    session_expires_at: 1234567890,
  }),
  postLogout: vi.fn().mockResolvedValue(undefined),
  postRegister: vi.fn(),
}));

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'AuthMutationTestWrapper';
  return Wrapper;
};

describe('Auth mutations — cache handoff on sign in/out', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(
      bootstrapQueryKeys.data({ userID: '', menuUpdateAt: '' }),
      { menus: [] },
    );
    queryClient.setQueryData(sharedQueryKeys.home.all(), { heroStats: {} });
    queryClient.setQueryData(sharedQueryKeys.rescueCases.all(), {});
  });

  it('login marks the bootstrap query stale so the new identity rebuilds the menu', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@test.com',
        password: 'x',
      });
    });

    const bootstrapState = queryClient.getQueryState(
      bootstrapQueryKeys.data({ userID: '', menuUpdateAt: '' }),
    );

    expect(bootstrapState?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryData(sharedQueryKeys.auth.currentUser('u-123')),
    ).toMatchObject({ userId: 'u-123' });
  });

  it('logout removes everything that was fetched for the signed-in user', async () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(
      queryClient.getQueryState(
        bootstrapQueryKeys.data({ userID: '', menuUpdateAt: '' }),
      ),
    ).toBeUndefined();
    expect(
      queryClient.getQueryState(sharedQueryKeys.home.all()),
    ).toBeUndefined();
    expect(
      queryClient.getQueryState(sharedQueryKeys.rescueCases.all()),
    ).toBeUndefined();
  });
});
