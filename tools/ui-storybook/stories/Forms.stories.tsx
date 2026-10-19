import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormProvider, useForm } from 'react-hook-form';

import { FormCheckbox } from '../../../packages/ui/src/components/form/form-check-box/FormCheckBox';
import { FormDateRanger } from '../../../packages/ui/src/components/form/form-date-ranger/FormDateRanger';
import { FormInput } from '../../../packages/ui/src/components/form/form-input/FormInput';
import { FormPhoneInput } from '../../../packages/ui/src/components/form/form-phone-input/FormPhoneInput';
import { FormRadio } from '../../../packages/ui/src/components/form/form-radio/FormRadio';
import { FormSelect } from '../../../packages/ui/src/components/form/form-select/FormSelect';
import { FormTextArea } from '../../../packages/ui/src/components/form/form-text-area/FormTextArea';

function FormPatternsDemo() {
  const methods = useForm({
    defaultValues: {
      fullName: 'Aoda Zhang',
      animalType: 'dog',
      urgency: 'normal',
      contactPhone: '+8613800138000',
      description: 'A friendly stray dog needs temporary shelter.',
      termsAccepted: true,
      rescueWindow: ['2026-10-19', '2026-10-26'],
    },
  });

  return (
    <FormProvider {...methods}>
      <form className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2" onSubmit={methods.handleSubmit(() => window.alert('Form preview submitted'))}>
        <FormInput name="fullName" label="Contact name" required autoComplete="name" />
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
          <FormDateRanger name="rescueWindow" label="Preferred rescue window" required />
        </div>
        <div className="md:col-span-2">
          <FormTextArea name="description" label="Situation details" rows={4} />
        </div>
        <div className="md:col-span-2">
          <FormCheckbox name="termsAccepted" label="I confirm these details are accurate" required />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button className="bg-primary text-primary-fg rounded-md px-4 py-2 text-sm" type="submit">Submit preview</button>
          <button className="border-border rounded-md border px-4 py-2 text-sm" type="button" onClick={() => methods.reset()}>Reset</button>
        </div>
      </form>
    </FormProvider>
  );
}

const meta = {
  title: 'UI Library/Form Patterns',
  component: FormPatternsDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Interactive examples for every React Hook Form pattern exported by @pawhaven/ui/form. Values are local to this Storybook preview and are not submitted to any backend.',
      },
    },
  },
} satisfies Meta<typeof FormPatternsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllFormComponents: Story = {};

export const PasswordField: Story = {
  render: () => {
    const PasswordDemo = () => {
      const methods = useForm({ defaultValues: { password: 'pawhaven-demo' } });
      return (
        <FormProvider {...methods}>
          <div className="w-full max-w-md">
            <FormInput name="password" label="Password" type="password" required />
          </div>
        </FormProvider>
      );
    };
    return <PasswordDemo />;
  },
};
