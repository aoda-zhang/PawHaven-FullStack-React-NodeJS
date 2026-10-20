import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormProvider, useForm } from 'react-hook-form';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormInput } from './FormInput';

const meta = {
  title: 'Components/Form/FormInput',
  component: FormInput,
  tags: ['autodocs'],
  args: {
    name: 'fullName',
    label: 'Contact name',
  },
} satisfies Meta<typeof FormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const PasswordField: Story = {
  render: () => <PasswordDemo />,
};

export const FormInputStory: Story = {
  name: 'FormInput',
  render: () => <SingleFormField field="input" />,
};
