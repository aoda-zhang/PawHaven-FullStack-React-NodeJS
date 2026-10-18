// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import type { AnimalFollowResult } from '@pawhaven/shared/types';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VolunteerInfo } from '../components/VolunteerInfo';

const mocks = vi.hoisted(() => ({
  followMutate: vi.fn(),
  unfollowMutate: vi.fn(),
  requestedAnimalId: { value: undefined as string | undefined },
  status: {
    value: undefined as AnimalFollowResult | undefined,
  },
  isLoading: { value: false },
  followState: { isPending: false, isError: false },
  unfollowState: { isPending: false, isError: false },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

vi.mock('../api/rescueDetail.queries', () => ({
  useFollowStatus: (animalId: string) => {
    mocks.requestedAnimalId.value = animalId;
    return { data: mocks.status.value, isLoading: mocks.isLoading.value };
  },
}));

vi.mock('../api/rescueDetail.mutations', () => ({
  useFollowAnimal: () => ({ mutate: mocks.followMutate, ...mocks.followState }),
  useUnfollowAnimal: () => ({
    mutate: mocks.unfollowMutate,
    ...mocks.unfollowState,
  }),
}));

const animalId = 'PAW-0001';

const status = (
  overrides: Partial<AnimalFollowResult> = {},
): AnimalFollowResult => ({
  animalId,
  isFollowing: false,
  followedAt: null,
  followerCount: 7,
  ...overrides,
});

const renderInfo = () => render(<VolunteerInfo animalId={animalId} />);

describe('VolunteerInfo follow wiring', () => {
  beforeEach(() => {
    mocks.followMutate.mockReset();
    mocks.unfollowMutate.mockReset();
    mocks.requestedAnimalId.value = undefined;
    mocks.status.value = undefined;
    mocks.isLoading.value = false;
    mocks.followState.isPending = false;
    mocks.followState.isError = false;
    mocks.unfollowState.isPending = false;
    mocks.unfollowState.isError = false;
  });

  it('requests the follow status for the animal it was given', () => {
    mocks.status.value = status();

    renderInfo();

    expect(mocks.requestedAnimalId.value).toBe(animalId);
  });

  it('passes the loaded follow status into the follow button', () => {
    mocks.status.value = status();

    renderInfo();

    expect(
      screen.getByRole('button', { name: /rescueDetail\.follow$/ }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('passes the followed status into the follow button', () => {
    mocks.status.value = status({ isFollowing: true, followerCount: 8 });

    renderInfo();

    expect(
      screen.getByRole('button', { name: /rescueDetail\.following/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders the follower count from the query data', () => {
    mocks.status.value = status({ followerCount: 7 });

    renderInfo();

    expect(screen.getByText('rescueDetail.followers_count')).toBeVisible();
  });

  it('follows the animal on click when it is not followed', () => {
    mocks.status.value = status();

    renderInfo();
    screen.getByRole('button', { name: /rescueDetail\.follow$/ }).click();

    expect(mocks.followMutate).toHaveBeenCalledWith(animalId);
    expect(mocks.unfollowMutate).not.toHaveBeenCalled();
  });

  it('unfollows the animal on click when it is followed', () => {
    mocks.status.value = status({ isFollowing: true });

    renderInfo();
    screen.getByRole('button', { name: /rescueDetail\.following/ }).click();

    expect(mocks.unfollowMutate).toHaveBeenCalledWith(animalId);
    expect(mocks.followMutate).not.toHaveBeenCalled();
  });

  it('disables the follow button while the status is loading', () => {
    mocks.isLoading.value = true;

    const { container } = renderInfo();

    expect(container.querySelector('button')).toBeDisabled();
    expect(screen.queryByText('rescueDetail.followers_count')).toBeNull();
  });

  it('shows the pending state while a follow action is in flight', () => {
    mocks.followState.isPending = true;

    const { container } = renderInfo();

    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('surfaces the follow error when the follow action fails', () => {
    mocks.followState.isError = true;

    renderInfo();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'rescueDetail.follow_error',
    );
  });

  it('surfaces the unfollow error when the unfollow action fails', () => {
    mocks.status.value = status({ isFollowing: true });
    mocks.unfollowState.isError = true;

    renderInfo();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'rescueDetail.unfollow_error',
    );
  });
});
