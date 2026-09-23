// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VolunteerInfo } from '../components/VolunteerInfo';

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

vi.mock('@/features/animal-follow/components/FollowButton', () => ({
  FollowButton: ({ animalId }: { animalId: string }) => (
    <span data-testid="follow-button">{animalId}</span>
  ),
}));

vi.mock('@/features/animal-follow/components/FollowerCount', () => ({
  FollowerCount: ({ animalId }: { animalId: string }) => (
    <span data-testid="follower-count">{animalId}</span>
  ),
}));

describe('VolunteerInfo follow wiring', () => {
  it('passes the animal id to the follow button and the follower count', () => {
    render(<VolunteerInfo animalId="PAW-0001" />);

    expect(screen.getByTestId('follow-button')).toHaveTextContent('PAW-0001');
    expect(screen.getByTestId('follower-count')).toHaveTextContent('PAW-0001');
  });
});
