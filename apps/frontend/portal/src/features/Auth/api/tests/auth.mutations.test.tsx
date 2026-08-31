import '@testing-library/jest-dom/vitest';

import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useLogin, useLogout } from '../auth.mutations';
import { authQueryKeys } from '../auth.queryKeys';

import { landingQueryKeys } from '@/features/Landing/api/landing.queryKeys';

const { mockSetProfile, mockEmptyProfile } = vi.hoisted(() => ({
  mockSetProfile: vi.fn((payload: unknown) => ({
    type: 'global/setProfile',
    payload,
  })),
  mockEmptyProfile: {
    accessToken: '',
    baseUserInfo: {
      email: '',
      userID: '',
      globalMenuUpdateAt: '',
      globalRouterUpdateAt: '',
    },
  },
}));

// Isolate the store module: importing the real one pulls in frontend-core (lottie), which jsdom cannot load.
vi.mock('@/store/globalReducer', () => ({
  setProfile: mockSetProfile,
  emptyProfile: mockEmptyProfile,
}));

// Mock API calls.
vi.mock('../auth.api', () => ({
  postLogin: vi.fn().mockResolvedValue({
    user: { userId: 'u-123', email: 'test@test.com', roles: [] },
    expires_in: 900,
    session_expires_at: 1234567890,
  }),
  postLogout: vi.fn().mockResolvedValue(undefined),
  postRegister: vi.fn(),
}));

const createWrapper = (queryClient: QueryClient) => {
  const testStore = configureStore({
    reducer: (state: Record<string, unknown> = {}) => state,
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={testStore}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
  Wrapper.displayName = 'AuthMutationTestWrapper';
  return Wrapper;
};

describe('Auth mutations — profile sync + bootstrap invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockSetProfile.mockClear();
    // Pre-populate cache with bootstrap and auth queries.
    queryClient.setQueryData(landingQueryKeys.all, { menus: [], routers: [] });
    queryClient.setQueryData(authQueryKeys.all, { user: null });
  });

  it('login onSuccess writes the profile and invalidates both bootstrap queries', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@test.com',
        password: 'x',
      });
    });

    expect(mockSetProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUserInfo: expect.objectContaining({ userID: 'u-123' }),
      }),
    );

    // Both queries should be marked stale after invalidation.
    const authState = queryClient.getQueryState(authQueryKeys.all);
    const landingState = queryClient.getQueryState(landingQueryKeys.all);

    expect(authState?.isInvalidated).toBe(true);
    expect(landingState?.isInvalidated).toBe(true);
  });

  it('logout onSuccess resets the profile and invalidates both bootstrap queries', async () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockSetProfile).toHaveBeenCalledWith(mockEmptyProfile);

    const authState = queryClient.getQueryState(authQueryKeys.all);
    const landingState = queryClient.getQueryState(landingQueryKeys.all);

    expect(authState?.isInvalidated).toBe(true);
    expect(landingState?.isInvalidated).toBe(true);
  });
});
