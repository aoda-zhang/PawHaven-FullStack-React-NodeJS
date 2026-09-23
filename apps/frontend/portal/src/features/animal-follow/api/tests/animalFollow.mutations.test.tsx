import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AnimalFollowResult } from '@pawhaven/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { followAnimal, unfollowAnimal } from '../animalFollow.api';
import { useFollowAnimal, useUnfollowAnimal } from '../animalFollow.mutations';
import { animalFollowQueryKeys } from '../animalFollow.queryKeys';

vi.mock('../animalFollow.api', () => ({
  followAnimal: vi.fn(),
  unfollowAnimal: vi.fn(),
}));

const animalId = 'PAW-0001';

const followedResult: AnimalFollowResult = {
  animalId,
  isFollowing: true,
  followedAt: '2026-09-16T10:00:00.000Z',
  followerCount: 4,
};

const unfollowedResult: AnimalFollowResult = {
  animalId,
  isFollowing: false,
  followedAt: null,
  followerCount: 3,
};

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('animalFollow mutations', () => {
  beforeEach(() => {
    vi.mocked(followAnimal).mockReset();
    vi.mocked(unfollowAnimal).mockReset();
  });

  it('caches the returned status and follower count on follow without refetching', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(followAnimal).mockResolvedValue(followedResult);

    const { result } = renderHook(() => useFollowAnimal(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(animalId);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(vi.mocked(followAnimal).mock.calls[0]?.[0]).toBe(animalId);
    expect(
      queryClient.getQueryData(animalFollowQueryKeys.status(animalId)),
    ).toEqual(followedResult);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('caches the returned status and follower count on unfollow without refetching', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(unfollowAnimal).mockResolvedValue(unfollowedResult);

    const { result } = renderHook(() => useUnfollowAnimal(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(animalId);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(vi.mocked(unfollowAnimal).mock.calls[0]?.[0]).toBe(animalId);
    expect(
      queryClient.getQueryData(animalFollowQueryKeys.status(animalId)),
    ).toEqual(unfollowedResult);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
