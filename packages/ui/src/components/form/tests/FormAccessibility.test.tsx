// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { act, render, screen } from '@testing-library/react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { FormCheckbox } from '../form-check-box/FormCheckBox';
import { FormDateRanger } from '../form-date-ranger/FormDateRanger';
import { FormInput } from '../form-input/FormInput';
import { FormPhoneInput } from '../form-phone-input/FormPhoneInput';
import { FormRadio } from '../form-radio/FormRadio';
import { FormSelect } from '../form-select/FormSelect';
import { FormTextArea } from '../form-text-area/FormTextArea';

type FormValues = Record<string, unknown>;

let formMethods: UseFormReturn<FormValues>;

const FormHarness = ({ children }: { children: ReactNode }) => {
  formMethods = useForm<FormValues>();

  return (
    <FormProvider {...formMethods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe('form control accessibility', () => {
  it('associates labels and required state with every shared form control', () => {
    render(
      <FormHarness>
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

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeRequired();
    expect(screen.getByRole('combobox', { name: 'Species' })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeRequired();
    expect(screen.getByRole('textbox', { name: 'Phone number' })).toBeRequired();
    expect(screen.getByRole('checkbox', { name: 'Urgent' })).toBeRequired();
    expect(
      screen.getByRole('radio', { name: 'Friendly' }),
    ).toBeRequired();
    expect(
      screen.getByRole('group', { name: 'Animal behavior' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Date range' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Date range start'),
    ).toBeRequired();
    expect(
      screen.getByLabelText('Date range end'),
    ).toBeRequired();
  });

  it('associates validation feedback with the affected controls', () => {
    render(
      <FormHarness>
        <FormInput name="name" label="Name" />
        <FormSelect
          name="species"
          label="Species"
          options={[{ label: 'Dog', value: 'dog' }]}
        />
        <FormTextArea name="description" label="Description" />
        <FormPhoneInput name="phone" label="Phone number" />
        <FormCheckbox name="urgent" label="Urgent" />
        <FormRadio
          name="behavior"
          label="Animal behavior"
          options={[{ label: 'Friendly', value: 'friendly' }]}
        />
        <FormDateRanger name="dates" label="Date range" />
      </FormHarness>,
    );

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
        formMethods.setError(name, {
          type: 'manual',
          message: `${name} is required`,
        });
      });
    });

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('combobox', { name: 'Species' })).toHaveAttribute(
      'aria-describedby',
    );
    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toHaveAttribute('aria-describedby');
    expect(
      screen.getByRole('textbox', { name: 'Phone number' }),
    ).toHaveAttribute('aria-describedby');
    expect(screen.getByRole('checkbox', { name: 'Urgent' })).toHaveAttribute(
      'aria-describedby',
    );
    expect(
      screen.getByRole('radio', { name: 'Friendly' }),
    ).toHaveAttribute('aria-describedby');
    expect(
      screen.getByRole('textbox', { name: 'Date range start' }),
    ).toHaveAttribute('aria-describedby');
    expect(screen.getAllByRole('alert')).toHaveLength(7);
  });
});
