import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { RescueCasesPage } from '../index';

// Mock the API queries.
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
    reportedAt: '1 hour ago',
    distance: '1.2 km',
  },
];

vi.mock('../api/rescueCases.queries', () => ({
  useFetchRescueCases: () => ({
    data: mockCases,
    isLoading: false,
    isError: false,
  }),
  useFetchRescueCase: (id: string) => {
    const found = mockCases.find((c) => c.id === id);
    return {
      data: found ?? undefined,
      isLoading: false,
      isError: !found,
    };
  },
}));

// Mock react-i18next — must provide initReactI18next for the i18n package.
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

// Mock lucide-react icons.
vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Clock: () => null,
  MapPin: () => null,
  User: () => null,
  ChevronRight: () => null,
}));

describe('RescueCasesPage — URL-driven flow', () => {
  it('renders the list view when no caseId param is present', () => {
    render(
      <MemoryRouter initialEntries={['/rescue-cases']}>
        <Routes>
          <Route path="/rescue-cases" element={<RescueCasesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Should show the section title (from i18n mock).
    expect(screen.getByText('rescue_cases.section_title')).toBeDefined();
    // Should show case cards.
    expect(screen.getByText('Test Cat')).toBeDefined();
  });

  it('renders detail view when caseId param is present', () => {
    render(
      <MemoryRouter initialEntries={['/rescue-cases/PAW-0001']}>
        <Routes>
          <Route path="/rescue-cases/:caseId" element={<RescueCasesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Detail view should show case title and the back button.
    expect(screen.getByText('Test Cat')).toBeDefined();
    expect(screen.getByText('rescue_cases.back_to_cases')).toBeDefined();
  });

  it('shows not-found message for invalid caseId', () => {
    render(
      <MemoryRouter initialEntries={['/rescue-cases/INVALID']}>
        <Routes>
          <Route path="/rescue-cases/:caseId" element={<RescueCasesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('rescue_cases.case_not_found')).toBeDefined();
  });
});
