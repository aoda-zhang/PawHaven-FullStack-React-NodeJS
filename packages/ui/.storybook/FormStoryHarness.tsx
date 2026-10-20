import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { FormCheckbox } from '../src/components/form/form-check-box/FormCheckBox';
import { FormDateRanger } from '../src/components/form/form-date-ranger/FormDateRanger';
import { FormInput } from '../src/components/form/form-input/FormInput';
import { FormPhoneInput } from '../src/components/form/form-phone-input/FormPhoneInput';
import { FormRadio } from '../src/components/form/form-radio/FormRadio';
import { FormSelect } from '../src/components/form/form-select/FormSelect';
import { FormTextArea } from '../src/components/form/form-text-area/FormTextArea';

const DESCRIPTION_ROWS = 4;

/**
 * The initial values every control needs to render in its filled state:
 * a radio group with nothing selected, a select showing its placeholder,
 * or an unchecked box tell the reader nothing about the control.
 */
const FORM_DEMO_VALUES = {
  fullName: 'Aoda Zhang',
  animalType: 'dog',
  urgency: 'normal',
  contactPhone: '+8613800138000',
  description: 'A friendly stray dog needs temporary shelter.',
  termsAccepted: true,
  rescueWindow: ['2026-10-19', '2026-10-26'],
};

export type SingleFormFieldName =
  | 'input'
  | 'select'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'dateRange'
  | 'phone';

/** Every React Hook Form control of the family, wired into one form. */
export const FormPatternsDemo = () => {
  const methods = useForm({ defaultValues: FORM_DEMO_VALUES });
  const [submitted, setSubmitted] = useState(false);

  return (
    <FormProvider {...methods}>
      <form
        className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2"
        onSubmit={methods.handleSubmit(() => setSubmitted(true))}
      >
        <FormInput
          name="fullName"
          label="Contact name"
          required
          autoComplete="name"
        />
        <FormSelect
          name="animalType"
          label="Animal type"
          required
          options={[
            { label: 'Dog', value: 'dog' },
            { label: 'Cat', value: 'cat' },
            { label: 'Other', value: 'other' },
          ]}
        />
        <FormRadio
          name="urgency"
          label="Rescue urgency"
          required
          options={[
            { label: 'Normal', value: 'normal' },
            { label: 'Urgent', value: 'urgent' },
          ]}
        />
        <FormPhoneInput name="contactPhone" label="Contact phone" required />
        <div className="md:col-span-2">
          <FormDateRanger
            name="rescueWindow"
            label="Preferred rescue window"
            required
          />
        </div>
        <div className="md:col-span-2">
          <FormTextArea
            name="description"
            label="Situation details"
            rows={DESCRIPTION_ROWS}
          />
        </div>
        <div className="md:col-span-2">
          <FormCheckbox
            name="termsAccepted"
            label="I confirm these details are accurate"
            required
          />
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <button
            className="bg-primary text-primary-fg rounded-md px-4 py-2 text-sm"
            type="submit"
          >
            Submit preview
          </button>
          <button
            className="border-border rounded-md border px-4 py-2 text-sm"
            type="button"
            onClick={() => {
              methods.reset();
              setSubmitted(false);
            }}
          >
            Reset
          </button>
          {submitted && (
            <p className="text-text-secondary text-sm" role="status">
              Form preview submitted
            </p>
          )}
        </div>
      </form>
    </FormProvider>
  );
};

/** A single control of the family, wired into its own form. */
export const SingleFormField = ({ field }: { field: SingleFormFieldName }) => {
  const methods = useForm({ defaultValues: FORM_DEMO_VALUES });

  return (
    <FormProvider {...methods}>
      <div className="w-full max-w-md">
        {field === 'input' && (
          <FormInput
            name="fullName"
            label="Contact name"
            required
            autoComplete="name"
          />
        )}
        {field === 'select' && (
          <FormSelect
            name="animalType"
            label="Animal type"
            required
            options={[
              { label: 'Dog', value: 'dog' },
              { label: 'Cat', value: 'cat' },
              { label: 'Other', value: 'other' },
            ]}
          />
        )}
        {field === 'textarea' && (
          <FormTextArea
            name="description"
            label="Situation details"
            rows={DESCRIPTION_ROWS}
          />
        )}
        {field === 'checkbox' && (
          <FormCheckbox
            name="termsAccepted"
            label="I confirm these details are accurate"
            required
          />
        )}
        {field === 'radio' && (
          <FormRadio
            name="urgency"
            label="Rescue urgency"
            required
            options={[
              { label: 'Normal', value: 'normal' },
              { label: 'Urgent', value: 'urgent' },
            ]}
          />
        )}
        {field === 'dateRange' && (
          <FormDateRanger
            name="rescueWindow"
            label="Preferred rescue window"
            required
          />
        )}
        {field === 'phone' && (
          <FormPhoneInput name="contactPhone" label="Contact phone" required />
        )}
      </div>
    </FormProvider>
  );
};

/** The size and variant matrix shared by the form controls. */
export const FormControlVariantsDemo = () => {
  const methods = useForm({
    defaultValues: {
      small: '',
      medium: '',
      standard: '',
      outline: '',
      fill: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput name="small" label="Small size" size="sm" />
        <FormInput name="medium" label="Medium size" size="md" />
        <FormInput
          name="standard"
          label="Standard variant"
          variant="standard"
        />
        <FormInput name="outline" label="Outline variant" variant="outline" />
        <FormInput name="fill" label="Fill variant" variant="fill" />
      </div>
    </FormProvider>
  );
};
