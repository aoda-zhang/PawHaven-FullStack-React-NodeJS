// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { FormCheckbox } from '../form-check-box/FormCheckBox';
import { FormDateRanger } from '../form-date-ranger/FormDateRanger';
import { FormInput } from '../form-input/FormInput';
import { FormPhoneInput } from '../form-phone-input/FormPhoneInput';
import { FormRadio } from '../form-radio/FormRadio';
import { FormSelect } from '../form-select/FormSelect';
import { FormTextArea } from '../form-text-area/FormTextArea';

type FormValues = Record<string, unknown>;

const FormHarness = ({
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

const expectDescribedError = (control: HTMLElement, message: string) => {
  const describedBy = control.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  if (!describedBy) throw new Error('expected an aria-describedby reference');

  const errorElement = document.getElementById(describedBy);
  expect(errorElement).not.toBeNull();
  expect(errorElement).toHaveTextContent(message);
  expect(errorElement).not.toHaveAttribute('role', 'alert');
};

const renderAllControls = (
  onFormReady?: (methods: UseFormReturn<FormValues>) => void,
) =>
  render(
    <FormHarness onFormReady={onFormReady}>
      <FormInput name="name" label="Name" required />
      <FormSelect
        name="species"
        label="Species"
        required
        options={[{ label: 'Dog', value: 'dog' }]}
      />
      <FormTextArea name="description" label="Description" required />
      <FormPhoneInput name="phone" label="Phone number" required />
      <FormCheckbox name="urgent" label="Urgent" required />
      <FormRadio
        name="behavior"
        label="Animal behavior"
        required
        options={[{ label: 'Friendly', value: 'friendly' }]}
      />
      <FormDateRanger name="dates" label="Date range" required />
    </FormHarness>,
  );

describe('form control accessibility', () => {
  it('associates labels and required state with every shared form control', () => {
    renderAllControls();

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeRequired();
    expect(screen.getByRole('combobox', { name: 'Species' })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeRequired();
    expect(
      screen.getByRole('textbox', { name: 'Phone number' }),
    ).toBeRequired();
    expect(screen.getByRole('checkbox', { name: 'Urgent' })).toBeRequired();
    expect(screen.getByRole('radio', { name: 'Friendly' })).toBeRequired();
    expect(
      screen.getByRole('radiogroup', { name: 'Animal behavior' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Date range' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Date range start')).toBeInTheDocument();
    expect(screen.getByLabelText('Date range end')).toBeInTheDocument();
  });

  it('requires a date range as a whole instead of each end', () => {
    renderAllControls();

    expect(screen.getByLabelText('Date range start')).not.toBeRequired();
    expect(screen.getByLabelText('Date range end')).not.toBeRequired();
    expect(
      screen.getByRole('group', { name: 'Date range' }).querySelector('legend'),
    ).toHaveTextContent('*');
  });

  it('associates validation feedback with the affected controls', () => {
    let formMethods: UseFormReturn<FormValues> | undefined;
    renderAllControls((methods) => {
      formMethods = methods;
    });

    act(() => {
      [
        'name',
        'species',
        'description',
        'phone',
        'urgent',
        'behavior',
        'dates',
      ].forEach((name) => {
        formMethods?.setError(name, {
          type: 'manual',
          message: `${name} is required`,
        });
      });
    });

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expectDescribedError(
      screen.getByRole('textbox', { name: 'Name' }),
      'name is required',
    );
    expectDescribedError(
      screen.getByRole('combobox', { name: 'Species' }),
      'species is required',
    );
    expectDescribedError(
      screen.getByRole('textbox', { name: 'Description' }),
      'description is required',
    );
    expectDescribedError(
      screen.getByRole('textbox', { name: 'Phone number' }),
      'phone is required',
    );
    expectDescribedError(
      screen.getByRole('checkbox', { name: 'Urgent' }),
      'urgent is required',
    );
    expectDescribedError(
      screen.getByRole('radiogroup', { name: 'Animal behavior' }),
      'behavior is required',
    );
    expectDescribedError(
      screen.getByRole('group', { name: 'Date range' }),
      'dates is required',
    );
  });

  it('announces a group error once instead of once per option', () => {
    let formMethods: UseFormReturn<FormValues> | undefined;
    renderAllControls((methods) => {
      formMethods = methods;
    });

    act(() => {
      formMethods?.setError('behavior', {
        type: 'manual',
        message: 'behavior is required',
      });
    });

    const group = screen.getByRole('radiogroup', { name: 'Animal behavior' });
    expect(group).toHaveAttribute('aria-describedby');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('radio', { name: 'Friendly' })).not.toHaveAttribute(
      'aria-describedby',
    );
    expect(screen.getByRole('radio', { name: 'Friendly' })).not.toHaveAttribute(
      'aria-invalid',
    );
  });

  it('never announces an error through both a live region and a description', () => {
    let formMethods: UseFormReturn<FormValues> | undefined;
    renderAllControls((methods) => {
      formMethods = methods;
    });

    act(() => {
      formMethods?.setError('name', {
        type: 'manual',
        message: 'name is required',
      });
    });

    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });
});
