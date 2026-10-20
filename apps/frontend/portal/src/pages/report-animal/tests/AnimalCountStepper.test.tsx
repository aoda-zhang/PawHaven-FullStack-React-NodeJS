// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnimalCountStepper } from '../components/AnimalCountStepper';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('lucide-react', () => ({
  Minus: () => null,
  Plus: () => null,
}));

const renderStepper = (initialCount = 1) => {
  const state: { getCount: () => number | undefined } = {
    getCount: () => undefined,
  };
  const Harness = () => {
    const form = useForm<ReportAnimalFormValues>({
      defaultValues: { animalCount: initialCount },
    });
    state.getCount = () => form.getValues('animalCount');
    return (
      <FormProvider {...form}>
        <AnimalCountStepper label="Animal count" />
      </FormProvider>
    );
  };
  render(<Harness />);
  return state;
};

describe('AnimalCountStepper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the initial count', () => {
    renderStepper(3);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('increments the count when the plus button is clicked', () => {
    const state = renderStepper(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'reportAnimal.count_increase' }),
    );
    expect(state.getCount()).toBe(2);
  });

  it('decrements the count when the minus button is clicked', () => {
    const state = renderStepper(3);
    fireEvent.click(
      screen.getByRole('button', { name: 'reportAnimal.count_decrease' }),
    );
    expect(state.getCount()).toBe(2);
  });

  it('does not go below 1', () => {
    const state = renderStepper(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'reportAnimal.count_decrease' }),
    );
    expect(state.getCount()).toBe(1);
  });

  it('stays at 1 after multiple decrease attempts', () => {
    const state = renderStepper(1);
    const decreaseButton = screen.getByRole('button', {
      name: 'reportAnimal.count_decrease',
    });
    fireEvent.click(decreaseButton);
    fireEvent.click(decreaseButton);
    fireEvent.click(decreaseButton);
    expect(state.getCount()).toBe(1);
  });
});
