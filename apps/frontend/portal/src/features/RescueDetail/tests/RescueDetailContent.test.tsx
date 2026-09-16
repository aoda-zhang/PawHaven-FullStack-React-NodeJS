// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import type { RescueDetail } from '@pawhaven/shared/types';
import { describe, expect, it, vi } from 'vitest';

import { RescueDetailContent } from '../components/RescueDetailContent';

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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as Record<string, unknown>),
    useNavigate: () => vi.fn(),
  };
});

const buildAnimal = (reporterName: string | null): RescueDetail => ({
  id: 'PAW-0001',
  animalType: 'cat',
  age: 'adult',
  status: 'pending',
  statusDescription: null,
  description: 'Injured cat found near the park',
  size: 'medium',
  animalCount: 1,
  appearance: { color: 'ginger' },
  location: { address: 'PawHaven Street 1' },
  photos: [],
  distance: 1.2,
  reporter: { reporterId: 'user-1', reporterName },
  reportedAt: '2026-09-16T10:00:00.000Z',
});

const renderContent = (reporterName: string | null) =>
  render(<RescueDetailContent animal={buildAnimal(reporterName)} />);

describe('RescueDetailContent timeline author', () => {
  it('shows the reporter username on the reported entry', () => {
    renderContent('PawRescuer');

    expect(screen.getByText(/PawRescuer/)).toBeInTheDocument();
    expect(screen.queryByText(/common\.anonymous/)).toBeNull();
  });

  it('falls back to the anonymous label when the reporter has no username', () => {
    renderContent(null);

    expect(screen.getByText(/common\.anonymous/)).toBeInTheDocument();
  });
});
