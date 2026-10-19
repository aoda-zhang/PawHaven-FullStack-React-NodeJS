// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FormDateRanger } from '../FormDateRanger';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return <FormProvider {...methods}><form>{children}</form></FormProvider>;
};

describe('FormDateRanger', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(<Harness><FormDateRanger name="dates" label="Date range" /></Harness>);
    expect(screen.getByRole('group', { name: 'Date range' })).toBeInTheDocument();
  });
});
