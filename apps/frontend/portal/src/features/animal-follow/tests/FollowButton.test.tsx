// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FollowButton } from '../components/FollowButton';

const mocks = vi.hoisted(() => ({
  followMutate: vi.fn(),
  unfollowMutate: vi.fn(),
  isFollowing: { value: false as boolean },
  isLoading: { value: false as boolean },
  mutationError: { value: 'none' as 'none' | 'follow' | 'unfollow' },
  statusQuery: {
    value: null as { animalId: string } | null,
  },
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

vi.mock('../api/animalFollow.queries', () => ({
  useFollowStatus: (animalId: string) => {
    mocks.statusQuery.value = { animalId };
    return {
      data: { animalId: 'PAW-0001', isFollowing: mocks.isFollowing.value },
      isLoading: mocks.isLoading.value,
    };
  },
}));

vi.mock('../api/animalFollow.mutations', () => ({
  useFollowAnimal: () => ({
    mutate: mocks.followMutate,
    isPending: false,
    isError: mocks.mutationError.value === 'follow',
  }),
  useUnfollowAnimal: () => ({
    mutate: mocks.unfollowMutate,
    isPending: false,
    isError: mocks.mutationError.value === 'unfollow',
  }),
}));

const animalId = 'PAW-0001';

const renderButton = () => render(<FollowButton animalId={animalId} />);

describe('FollowButton', () => {
  beforeEach(() => {
    mocks.followMutate.mockReset();
    mocks.unfollowMutate.mockReset();
    mocks.isFollowing.value = false;
    mocks.isLoading.value = false;
    mocks.mutationError.value = 'none';
    mocks.statusQuery.value = null;
  });

  it('renders the follow control without requiring a signed-in profile', () => {
    renderButton();

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(mocks.statusQuery.value).toEqual({ animalId });
  });

  it('renders the follow state when the animal is not followed', () => {
    renderButton();

    expect(screen.getByRole('button')).toHaveTextContent('animalFollow.follow');
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the following state when the animal is followed', () => {
    mocks.isFollowing.value = true;

    renderButton();

    expect(screen.getByRole('button')).toHaveTextContent(
      'animalFollow.following',
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('follows the animal on click when not following', () => {
    renderButton();

    screen.getByRole('button').click();

    expect(mocks.followMutate).toHaveBeenCalledWith(animalId);
    expect(mocks.unfollowMutate).not.toHaveBeenCalled();
  });

  it('unfollows the animal on click when following', () => {
    mocks.isFollowing.value = true;

    renderButton();

    screen.getByRole('button').click();

    expect(mocks.unfollowMutate).toHaveBeenCalledWith(animalId);
    expect(mocks.followMutate).not.toHaveBeenCalled();
  });

  it('disables the button while the follow status is loading', () => {
    mocks.isLoading.value = true;

    renderButton();

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('surfaces the follow error when the follow mutation fails', () => {
    mocks.mutationError.value = 'follow';

    renderButton();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'animalFollow.follow_error',
    );
  });

  it('surfaces the unfollow error when the unfollow mutation fails', () => {
    mocks.mutationError.value = 'unfollow';

    renderButton();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'animalFollow.unfollow_error',
    );
  });
});
