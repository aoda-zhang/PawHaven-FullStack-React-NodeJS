import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RescueCasesSection } from '../components/RescueCasesSection';
import type { RescueCase } from '../types';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ArrowRight: () => null,
    Clock: () => null,
    MapPin: () => null,
  };
});

const mockCase: RescueCase = {
  id: 'PAW-0001',
  title: 'Test Cat',
  image: '/test.jpg',
  status: 'pending',
  urgency: 'high',
  animalType: 'cat',
  location: 'Test Location',
  description: 'Test description',
  reporterId: 'Tester',
  reportedAt: '2026-08-22T10:00:00.000Z',
  distance: 1.2,
};

describe('RescueCasesSection', () => {
  it('renders skeleton while loading', () => {
    render(<RescueCasesSection cases={[]} onCaseClick={vi.fn()} isLoading />);

    expect(screen.getByTestId('rescue-cases-skeleton')).toBeDefined();
    expect(screen.queryByText('rescue_cases.no_cases_found')).toBeNull();
  });

  it('renders cases after loading', () => {
    render(<RescueCasesSection cases={[mockCase]} onCaseClick={vi.fn()} />);

    expect(screen.queryByTestId('rescue-cases-skeleton')).toBeNull();
    expect(screen.getByText('Test Cat')).toBeDefined();
  });
});
