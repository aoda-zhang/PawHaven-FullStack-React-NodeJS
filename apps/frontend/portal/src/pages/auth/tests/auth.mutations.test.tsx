import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useLogin, useLogout, useRegister } from '../api/auth.mutations';

import { bootstrapQueryKeys } from '@/app/init/bootstrap.queryKeys';
import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

vi.mock('../api/auth.api', () => ({
  postLogin: vi.fn().mockResolvedValue({
    user: { userId: 'u-123', email: 'test@test.com', roles: [] },
    expires_in: 900,
    session_expires_at: 1234567890,
  }),
  postLogout: vi.fn().mockResolvedValue(undefined),
  postRegister: vi.fn().mockResolvedValue({
    user: { userId: 'u-456', email: 'new@test.com', roles: [] },
    expires_in: 900,
    session_expires_at: 1234567890,
  }),
}));

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'AuthMutationTestWrapper';
  return Wrapper;
};

describe('Auth mutations — session cache handoff', () => {
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

  it('login caches the authenticated user without starting a bootstrap refetch', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@test.com',
        password: 'x',
      });
    });

    expect(
      queryClient.getQueryData(sharedQueryKeys.auth.currentUser('u-123')),
    ).toMatchObject({ userId: 'u-123' });
    expect(
      queryClient.getQueryState(
        bootstrapQueryKeys.data({ userID: '', menuUpdateAt: '' }),
      )?.isInvalidated,
    ).toBe(false);
  });

  it('registration caches the newly registered user', async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'new@test.com',
        password: 'x',
      });
    });

    expect(
      queryClient.getQueryData(sharedQueryKeys.auth.currentUser('u-456')),
    ).toMatchObject({ userId: 'u-456' });
  });

  it('logout removes cached data belonging to the signed-in session', async () => {
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
