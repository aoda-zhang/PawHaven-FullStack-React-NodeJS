// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FollowButton } from '../components/FollowButton';

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

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...(actual as Record<string, unknown>),
    Bookmark: () => <span data-testid="bookmark-icon" />,
    BookmarkCheck: () => <span data-testid="bookmark-check-icon" />,
  };
});

const animalId = 'PAW-0001';

const renderButton = (
  props: Partial<React.ComponentProps<typeof FollowButton>> = {},
) =>
  render(<FollowButton animalId={animalId} isFollowing={false} {...props} />);

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the follow control from the props it was given', () => {
    renderButton();

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('bookmark-check-icon')).toBeNull();
  });

  it('renders the follow state when the animal is not followed', () => {
    renderButton({ isFollowing: false });

    expect(screen.getByRole('button')).toHaveTextContent('rescueDetail.follow');
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the following state when the animal is followed', () => {
    renderButton({ isFollowing: true });

    expect(screen.getByRole('button')).toHaveTextContent(
      'rescueDetail.following',
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('bookmark-check-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('bookmark-icon')).toBeNull();
  });

  it('follows the animal on click when not following', () => {
    const onFollow = vi.fn();
    const onUnfollow = vi.fn();

    renderButton({ isFollowing: false, onFollow, onUnfollow });

    screen.getByRole('button').click();

    expect(onFollow).toHaveBeenCalledTimes(1);
    expect(onUnfollow).not.toHaveBeenCalled();
  });

  it('unfollows the animal on click when following', () => {
    const onFollow = vi.fn();
    const onUnfollow = vi.fn();

    renderButton({ isFollowing: true, onFollow, onUnfollow });

    screen.getByRole('button').click();

    expect(onUnfollow).toHaveBeenCalledTimes(1);
    expect(onFollow).not.toHaveBeenCalled();
  });

  it('disables the button while the follow status is loading', () => {
    renderButton({ isLoading: true });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows the pending state while a follow action is in flight', () => {
    const { container } = renderButton({ isPending: true });

    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('surfaces the follow error when the follow action fails', () => {
    renderButton({ hasError: true, errorKey: 'rescueDetail.follow_error' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'rescueDetail.follow_error',
    );
  });

  it('surfaces the unfollow error when the unfollow action fails', () => {
    renderButton({
      isFollowing: true,
      hasError: true,
      errorKey: 'rescueDetail.unfollow_error',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'rescueDetail.unfollow_error',
    );
  });
});
