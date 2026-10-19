// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FormInput } from '../FormInput';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return <FormProvider {...methods}><form>{children}</form></FormProvider>;
};

describe('FormInput', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(<Harness><FormInput name="name" label="Name" /></Harness>);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });
});
