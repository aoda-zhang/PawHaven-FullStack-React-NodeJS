// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormPhoneInput } from '../FormPhoneInput';

const Harness = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: {} });
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe('FormPhoneInput', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(
      <Harness>
        <FormPhoneInput name="phone" label="Phone number" />
      </Harness>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Phone number' }),
    ).toBeInTheDocument();
  });

  it('disables the phone input', () => {
    render(
      <Harness>
        <FormPhoneInput name="phone" label="Phone number" disabled />
      </Harness>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Phone number' }),
    ).toBeDisabled();
  });
});
