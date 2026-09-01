// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ReportAnimalForm } from '../components/ReportAnimalForm';

vi.mock('lottie-react', () => ({ Lottie: () => null, default: () => null }));
vi.mock('lottie-web', () => ({ default: {} }));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mutate = vi.fn();

vi.mock('../api/reportAnimal.mutations', () => ({
  useCreateReportAnimal: () => ({ mutate, isPending: false }),
}));

const renderForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<ReportAnimalForm />, { wrapper: Wrapper });
};

describe('ReportAnimalForm validation messages', () => {
  it('does not submit and shows required errors for every empty required field', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'reportAnimal.submit' }));

    await waitFor(() => {
      expect(mutate).not.toHaveBeenCalled();
    });

    const expectedMessages = [
      'reportAnimal.address_required',
      'reportAnimal.color_required',
      'reportAnimal.photos_required',
      'reportAnimal.size_required',
      'reportAnimal.age_required',
      'reportAnimal.behavior_required',
      'reportAnimal.contact_required',
    ];

    await waitFor(() => {
      expectedMessages.forEach((message) => {
        expect(screen.getAllByText(message).length).toBeGreaterThan(0);
      });
    });
  });
});
