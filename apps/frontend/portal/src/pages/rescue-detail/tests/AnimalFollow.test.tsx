// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import type { AnimalFollowResult } from '@pawhaven/shared/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); } });

import { AnimalFollow } from '../components/AnimalFollow';

const mocks = vi.hoisted(() => ({
  followMutate: vi.fn(), unfollowMutate: vi.fn(), navigate: vi.fn(), isAuthenticated: false,
  status: undefined as AnimalFollowResult | undefined, isLoading: false,
  followIsPending: false, followIsError: false, unfollowIsPending: false, unfollowIsError: false,
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return { ...(actual as Record<string, unknown>), useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }) };
});
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...(actual as Record<string, unknown>), useNavigate: () => mocks.navigate };
});
vi.mock('@/app/providers/GlobalProvider', () => ({ useGlobalContext: () => ({ isAuthenticated: mocks.isAuthenticated }) }));
vi.mock('../api/rescueDetail.queries', () => ({ useFollowStatus: () => ({ data: mocks.status, isLoading: mocks.isLoading }) }));
vi.mock('../api/rescueDetail.mutations', () => ({
  useFollowAnimal: () => ({ mutate: mocks.followMutate, isPending: mocks.followIsPending, isError: mocks.followIsError }),
  useUnfollowAnimal: () => ({ mutate: mocks.unfollowMutate, isPending: mocks.unfollowIsPending, isError: mocks.unfollowIsError }),
}));

const animalId = 'PAW-0001';
const status = (overrides: Partial<AnimalFollowResult> = {}): AnimalFollowResult => ({ animalId, isFollowing: false, followedAt: null, followerCount: 7, ...overrides });
const renderFollow = () => render(<AnimalFollow animalId={animalId} />);

describe('AnimalFollow', () => {
  beforeEach(() => {
    mocks.followMutate.mockReset(); mocks.unfollowMutate.mockReset(); mocks.navigate.mockReset();
    mocks.isAuthenticated = false; mocks.status = status(); mocks.isLoading = false;
    mocks.followIsPending = false; mocks.followIsError = false; mocks.unfollowIsPending = false; mocks.unfollowIsError = false;
  });

  it('prompts a guest to sign up instead of calling the follow mutation', () => {
    renderFollow();
    fireEvent.click(screen.getByRole('button', { name: /rescueDetail\.follow$/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('rescueDetail.follow_signup_message')).toBeVisible();
    expect(mocks.followMutate).not.toHaveBeenCalled();
  });

  it('navigates to registration when the guest chooses sign up', () => {
    renderFollow();
    fireEvent.click(screen.getByRole('button', { name: /rescueDetail\.follow$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'rescueDetail.follow_signup_cta' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/auth/register');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mocks.followMutate).not.toHaveBeenCalled();
  });

  it('closes the prompt when the guest chooses maybe later', () => {
    renderFollow();
    fireEvent.click(screen.getByRole('button', { name: /rescueDetail\.follow$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'rescueDetail.follow_signup_dismiss' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('follows immediately when an authenticated user clicks follow', () => {
    mocks.isAuthenticated = true;
    renderFollow();
    fireEvent.click(screen.getByRole('button', { name: /rescueDetail\.follow$/ }));
    expect(mocks.followMutate).toHaveBeenCalledWith(animalId);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('unfollows immediately when an authenticated user clicks following', () => {
    mocks.isAuthenticated = true; mocks.status = status({ isFollowing: true });
    renderFollow();
    fireEvent.click(screen.getByRole('button', { name: /rescueDetail\.following/ }));
    expect(mocks.unfollowMutate).toHaveBeenCalledWith(animalId);
    expect(mocks.followMutate).not.toHaveBeenCalled();
  });

  it('does not show a stale following state to a guest', () => {
    mocks.status = status({ isFollowing: true });
    renderFollow();
    expect(screen.getByRole('button', { name: /rescueDetail\.follow$/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables follow while a request is pending to prevent duplicate submissions', () => {
    mocks.isAuthenticated = true; mocks.followIsPending = true;
    renderFollow();
    const button = screen.getByRole('button', { name: /rescueDetail\.follow$/ });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mocks.followMutate).not.toHaveBeenCalled();
  });
});
