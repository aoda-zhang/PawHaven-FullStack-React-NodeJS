// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FormSelect } from '../FormSelect';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return <FormProvider {...methods}><form>{children}</form></FormProvider>;
};

describe('FormSelect', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(<Harness><FormSelect name="species" label="Species" options={[{ label: 'Dog', value: 'dog' }]} /></Harness>);
    expect(screen.getByRole('combobox', { name: 'Species' })).toBeInTheDocument();
  });
});
