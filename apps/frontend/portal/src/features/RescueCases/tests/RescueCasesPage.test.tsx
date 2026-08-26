import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { RescueCasesPage } from '../index';

const mockCases = [
  {
    id: 'PAW-0001',
    title: 'Test Cat',
    image: '/test.jpg',
    status: 'pending' as const,
    urgency: 'high' as const,
    animalType: 'cat',
    location: 'Test Location',
    description: 'Test description',
    reporter: 'Tester',
    reportedAt: '2026-08-22T10:00:00.000Z',
    distance: '1.2 km',
  },
];

vi.mock('../api/rescueCases.queries', () => ({
  useFetchRescueCases: () => ({
    data: mockCases,
    isLoading: false,
    isError: false,
  }),
  useFetchRescueCase: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

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

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowLeft: () => null,
    ArrowRight: () => null,
    Clock: () => null,
    MapPin: () => null,
    User: () => null,
    ChevronRight: () => null,
  };
});

describe('RescueCasesPage', () => {
  it('renders the case list', () => {
    render(
      <MemoryRouter>
        <RescueCasesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('rescue_cases.section_title')).toBeDefined();
    expect(screen.getByText('Test Cat')).toBeDefined();
  });
});
