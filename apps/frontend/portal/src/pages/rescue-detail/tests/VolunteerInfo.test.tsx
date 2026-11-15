// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VolunteerInfo } from '../components/VolunteerInfo';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en-US' } }),
  };
});

describe('VolunteerInfo', () => {
  it('renders the empty volunteer state without animal-follow controls', () => {
    render(<VolunteerInfo />);
    expect(screen.getByText('rescueDetail.no_volunteer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rescueDetail\.follow$/ })).toBeNull();
    expect(screen.queryByText('rescueDetail.followers_count')).toBeNull();
  });

  it('renders volunteer details when a volunteer is provided', () => {
    render(<VolunteerInfo volunteer={{ name: 'Alex', completedRescues: 12, avatar: 'https://example.com/avatar.png' }} />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('rescueDetail.volunteer_rescues')).toBeInTheDocument();
  });
});
