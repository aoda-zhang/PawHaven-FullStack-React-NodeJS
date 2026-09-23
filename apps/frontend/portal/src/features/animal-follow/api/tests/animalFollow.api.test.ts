import '@testing-library/jest-dom/vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  followAnimal,
  getFollowStatus,
  unfollowAnimal,
} from '../animalFollow.api';

import { apiClient } from '@/utils/apiClient';

vi.mock('@/utils/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPut = vi.mocked(apiClient.put);

const animalId = 'PAW-0001';

const resultPayload = {
  animalId,
  isFollowing: true,
  followedAt: '2026-09-16T10:00:00.000Z',
  followerCount: 4,
};

describe('animalFollow api', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPut.mockReset();
  });

  it('posts to /core/animal-follow/:animalId to follow, returning the follower count', async () => {
    mockedPost.mockResolvedValue(resultPayload);

    const result = await followAnimal(animalId);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith(`/core/animal-follow/${animalId}`);
    expect(result).toEqual(resultPayload);
  });

  it('puts /core/animal-follow/:animalId to unfollow, returning the follower count', async () => {
    const unfollowedPayload = { ...resultPayload, isFollowing: false };
    mockedPut.mockResolvedValue(unfollowedPayload);

    const result = await unfollowAnimal(animalId);

    expect(mockedPut).toHaveBeenCalledTimes(1);
    expect(mockedPut).toHaveBeenCalledWith(`/core/animal-follow/${animalId}`);
    expect(result).toEqual(unfollowedPayload);
  });

  it('gets the follow status and follower count for an animal', async () => {
    mockedGet.mockResolvedValue(resultPayload);

    const result = await getFollowStatus(animalId);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith(
      `/core/animal-follow/${animalId}/status`,
    );
    expect(result).toEqual(resultPayload);
  });
});
