// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FormCheckbox } from '../FormCheckBox';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return <FormProvider {...methods}><form>{children}</form></FormProvider>;
};

describe('FormCheckbox', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(<Harness><FormCheckbox name="urgent" label="Urgent" /></Harness>);
    expect(screen.getByRole('checkbox', { name: 'Urgent' })).toBeInTheDocument();
  });
});
