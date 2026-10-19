// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FormRadio } from '../FormRadio';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return <FormProvider {...methods}><form>{children}</form></FormProvider>;
};

describe('FormRadio', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(<Harness><FormRadio name="behavior" label="Behavior" options={[{ label: 'Friendly', value: 'friendly' }]} /></Harness>);
    expect(screen.getByRole('group', { name: 'Behavior' })).toBeInTheDocument();
  });
});
