import '@testing-library/jest-dom/vitest';

import type { RescueListItem } from '@pawhaven/shared/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RescueCasesSection } from '../components/RescueCasesSection';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) =>
        options === undefined ? key : `${key}:${JSON.stringify(options)}`,
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

const mockCase: RescueListItem = {
  id: 'PAW-0001',
  title: 'Test Cat',
  image: '/test.jpg',
  status: 'pending',
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

  it('renders the status summary through the count translations', () => {
    render(
      <RescueCasesSection
        cases={[
          mockCase,
          { ...mockCase, id: 'PAW-0002', status: 'inProgress' },
        ]}
        onCaseClick={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'rescue_cases.status_summary:{"pendingCount":1,"inProgressCount":1}',
      ),
    ).toBeDefined();
  });
});
