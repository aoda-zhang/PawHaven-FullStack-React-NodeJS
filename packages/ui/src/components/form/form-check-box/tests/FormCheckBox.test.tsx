// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormCheckbox } from '../FormCheckBox';

type FormValues = Record<string, unknown>;

const Harness = ({
  children,
  onFormReady,
}: {
  children: ReactNode;
  onFormReady?: (methods: UseFormReturn<FormValues>) => void;
}) => {
  const formMethods = useForm<FormValues>();

  useEffect(() => {
    onFormReady?.(formMethods);
  }, [formMethods, onFormReady]);

  return (
    <FormProvider {...formMethods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe('FormCheckbox', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(
      <Harness>
        <FormCheckbox name="urgent" label="Urgent" />
      </Harness>,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Urgent' }),
    ).toBeInTheDocument();
  });

  it('disables the checkbox', () => {
    render(
      <Harness>
        <FormCheckbox name="urgent" label="Urgent" disabled />
      </Harness>,
    );
    expect(screen.getByRole('checkbox', { name: 'Urgent' })).toBeDisabled();
  });

  it('applies full width to the container', () => {
    render(
      <Harness>
        <FormCheckbox name="urgent" label="Urgent" fullWidth />
      </Harness>,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Urgent' }).closest('div'),
    ).toHaveClass('w-full');
  });

  it('registers the checkbox so the form can focus it', async () => {
    let formMethods: UseFormReturn<FormValues> | undefined;
    const captureForm = (methods: UseFormReturn<FormValues>) => {
      formMethods = methods;
    };

    render(
      <Harness onFormReady={captureForm}>
        <FormCheckbox name="urgent" label="Urgent" />
      </Harness>,
    );

    act(() => {
      formMethods?.setFocus('urgent');
    });

    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Urgent' })).toHaveFocus(),
    );
  });
});
