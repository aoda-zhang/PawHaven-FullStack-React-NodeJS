// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FollowerCount } from '../components/FollowerCount';

const mocks = vi.hoisted(() => ({
  data: {
    value: undefined as
      | {
          animalId: string;
          isFollowing: boolean;
          followedAt: string | null;
          followerCount: number;
        }
      | undefined,
  },
  requestedAnimalId: { value: undefined as string | undefined },
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
    mocks.requestedAnimalId.value = animalId;
    return { data: mocks.data.value };
  },
}));

const animalId = 'PAW-0001';

const renderCount = () => render(<FollowerCount animalId={animalId} />);

describe('FollowerCount', () => {
  beforeEach(() => {
    mocks.data.value = undefined;
    mocks.requestedAnimalId.value = undefined;
  });

  it('renders nothing until the count has loaded', () => {
    const { container } = renderCount();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the follower count once it has loaded', () => {
    mocks.data.value = {
      animalId,
      isFollowing: false,
      followedAt: null,
      followerCount: 7,
    };

    renderCount();

    expect(screen.getByText('animalFollow.followers_count')).toBeVisible();
  });

  it('requests the status for the animal it was given', () => {
    mocks.data.value = {
      animalId,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    };

    renderCount();

    expect(mocks.requestedAnimalId.value).toBe(animalId);
  });
});
