// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormRadio } from '../FormRadio';

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

const options = [{ label: 'Friendly', value: 'friendly' }];

describe('FormRadio', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(
      <Harness>
        <FormRadio name="behavior" label="Behavior" options={options} />
      </Harness>,
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Behavior' }),
    ).toBeInTheDocument();
  });

  it('disables every option', () => {
    render(
      <Harness>
        <FormRadio
          name="behavior"
          label="Behavior"
          options={options}
          disabled
        />
      </Harness>,
    );
    expect(screen.getByRole('radio', { name: 'Friendly' })).toBeDisabled();
  });

  it('applies full width to the group', () => {
    render(
      <Harness>
        <FormRadio
          name="behavior"
          label="Behavior"
          options={options}
          fullWidth
        />
      </Harness>,
    );
    expect(screen.getByRole('radiogroup', { name: 'Behavior' })).toHaveClass(
      'w-full',
    );
  });

  it('honours the default value', () => {
    render(
      <Harness>
        <FormRadio
          name="behavior"
          label="Behavior"
          options={options}
          defaultValue="friendly"
        />
      </Harness>,
    );
    expect(screen.getByRole('radio', { name: 'Friendly' })).toBeChecked();
  });

  it('registers the group so the form can focus it', async () => {
    let formMethods: UseFormReturn<FormValues> | undefined;
    const captureForm = (methods: UseFormReturn<FormValues>) => {
      formMethods = methods;
    };

    render(
      <Harness onFormReady={captureForm}>
        <FormRadio name="behavior" label="Behavior" options={options} />
      </Harness>,
    );

    act(() => {
      formMethods?.setFocus('behavior');
    });

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Friendly' })).toHaveFocus(),
    );
  });
});
