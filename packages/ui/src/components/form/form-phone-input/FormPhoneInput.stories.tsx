import type { Meta, StoryObj } from '@storybook/react-vite';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormPhoneInput } from './FormPhoneInput';

const meta = {
  title: 'Components/Form/FormPhoneInput',
  component: FormPhoneInput,
  tags: ['autodocs'],
  args: {
    name: 'contactPhone',
    label: 'Contact phone',
  },
} satisfies Meta<typeof FormPhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormPhoneInputStory: Story = {
  name: 'FormPhoneInput',
  render: () => <SingleFormField field="phone" />,
};
