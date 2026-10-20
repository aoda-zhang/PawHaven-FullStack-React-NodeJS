import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { rescueCasesQueryKeys } from '../api/rescueCases.queryKeys';
import { RescueCasesPage } from '../index';

// Mock the apiClient to avoid config loading
vi.mock('@/shared/utils/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

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

const renderPage = (queryClient: QueryClient) => {
  // Pre-populate the query cache with mock data
  queryClient.setQueryData(rescueCasesQueryKeys.list(), mockCases);

  const router = createMemoryRouter([
    {
      path: '/',
      Component: RescueCasesPage,
    },
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe('RescueCasesPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  it('renders the case list', async () => {
    renderPage(queryClient);

    expect(await screen.findByText('rescue_cases.section_title')).toBeDefined();
    expect(await screen.findByText('Test Cat')).toBeDefined();
  });
});
