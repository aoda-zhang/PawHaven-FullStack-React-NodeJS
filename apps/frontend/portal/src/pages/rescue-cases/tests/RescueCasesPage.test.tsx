import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { RescueCasesPage } from '../index';

const mockCases = [
  {
    id: 'PAW-0001',
    title: 'Test Cat',
    image: '/test.jpg',
    status: 'pending' as const,
    animalType: 'cat',
    location: 'Test Location',
    description: 'Test description',
    reporterId: 'Tester',
    reportedAt: '2026-08-22T10:00:00.000Z',
    distance: '1.2 km',
  },
];

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

const renderPage = () => {
  const router = createMemoryRouter([
    {
      path: '/',
      Component: RescueCasesPage,
      loader: () => mockCases,
    },
  ]);

  return render(<RouterProvider router={router} />);
};

describe('RescueCasesPage', () => {
  it('renders the case list', async () => {
    renderPage();

    expect(await screen.findByText('rescue_cases.section_title')).toBeDefined();
    expect(await screen.findByText('Test Cat')).toBeDefined();
  });
});
