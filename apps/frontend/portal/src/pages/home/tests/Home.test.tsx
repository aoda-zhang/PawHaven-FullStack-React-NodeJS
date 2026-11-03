import '@testing-library/jest-dom/vitest';

import type { HomeData } from '@pawhaven/shared/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { homeQueryKeys } from '../api/home.queryKeys';
import { Home } from '../index';

import { apiClient } from '@/shared/utils/apiClient';

vi.mock('@/shared/utils/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/app/providers/GlobalProvider', () => ({
  useGlobalContext: () => ({ isAuthenticated: false }),
}));

vi.mock('../components/StrayCTA', () => ({
  StrayCTA: () => null,
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
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
    ArrowRight: () => null,
    ChevronRight: () => null,
    Clock: () => null,
    Heart: () => null,
    MapPin: () => null,
  };
});

const mockHomeData: HomeData = {
  heroStats: {
    totalRescues: 128,
    totalAdopted: 64,
    totalVolunteers: 32,
  },
  latestRescues: [
    {
      id: 'PAW-0001',
      title: 'Test Cat',
      image: '/test.jpg',
      status: 'pending',
      animalType: 'cat',
      location: 'Test Location',
      description: 'Test description',
      reporterId: 'Tester',
      reportedAt: '2026-08-22T10:00:00.000Z',
      distance: 0,
    },
  ],
  adoptablePets: [
    {
      id: 'PET-0001',
      name: 'Milo',
      animalType: 'cat',
      age: '2 years',
      sex: 'male',
      breed: 'Domestic',
      location: 'Test Location',
      waitingDays: 10,
      tags: ['Friendly'],
      photo: '/pet.jpg',
      rescuedFrom: 'Street',
      rescueDuration: '1 month',
      medicalRecords: ['Vaccinated'],
      temperament: 'Calm',
      adoptionStatus: 'available',
    },
  ],
};

const renderPage = (queryClient: QueryClient) => {
  const router = createMemoryRouter([
    {
      path: '/',
      Component: Home,
    },
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe('Home', () => {
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

  it('renders the sections from cached home data', () => {
    queryClient.setQueryData(homeQueryKeys.content(), mockHomeData);

    renderPage(queryClient);

    expect(screen.getByText('home.hero_headline')).toBeDefined();
    expect(screen.getByText('Test Cat')).toBeDefined();
    expect(screen.getByText('Milo')).toBeDefined();
  });

  it('hands a failed home query to the route error boundary', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('home failed'));

    const router = createMemoryRouter([
      {
        path: '/',
        Component: Home,
        ErrorBoundary: () => <div>home-error</div>,
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('home-error')).toBeInTheDocument();
  });
});
