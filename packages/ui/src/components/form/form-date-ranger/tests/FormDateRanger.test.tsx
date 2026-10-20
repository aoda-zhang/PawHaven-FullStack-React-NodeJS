// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormDateRanger } from '../FormDateRanger';

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

describe('FormDateRanger', () => {
  it('renders a labelled control inside FormProvider', () => {
    render(
      <Harness>
        <FormDateRanger name="dates" label="Date range" />
      </Harness>,
    );
    expect(
      screen.getByRole('group', { name: 'Date range' }),
    ).toBeInTheDocument();
  });

  it('disables both date inputs', () => {
    render(
      <Harness>
        <FormDateRanger name="dates" label="Date range" disabled />
      </Harness>,
    );
    expect(screen.getByLabelText('Date range start')).toBeDisabled();
    expect(screen.getByLabelText('Date range end')).toBeDisabled();
  });

  it('gives each date input a stable id bound to its label', () => {
    render(
      <Harness>
        <FormDateRanger name="dates" label="Date range" />
      </Harness>,
    );

    const start = screen.getByLabelText('Date range start');
    const end = screen.getByLabelText('Date range end');

    expect(start).toHaveAttribute('id');
    expect(end).toHaveAttribute('id');
    expect(start.getAttribute('id')).not.toBe(end.getAttribute('id'));
    expect(screen.getByRole('group', { name: 'Date range' })).toContainElement(
      start,
    );
  });

  it('registers the range so the form can focus the start input', async () => {
    let formMethods: UseFormReturn<FormValues> | undefined;
    const captureForm = (methods: UseFormReturn<FormValues>) => {
      formMethods = methods;
    };

    render(
      <Harness onFormReady={captureForm}>
        <FormDateRanger name="dates" label="Date range" />
      </Harness>,
    );

    act(() => {
      formMethods?.setFocus('dates');
    });

    await waitFor(() =>
      expect(screen.getByLabelText('Date range start')).toHaveFocus(),
    );
  });
});
