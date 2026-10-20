import type { Meta, StoryObj } from '@storybook/react-vite';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormRadio } from './FormRadio';

const meta = {
  title: 'Components/Form/FormRadio',
  component: FormRadio,
  tags: ['autodocs'],
  args: {
    name: 'urgency',
    label: 'Rescue urgency',
    options: [
      { label: 'Normal', value: 'normal' },
      { label: 'Urgent', value: 'urgent' },
    ],
  },
} satisfies Meta<typeof FormRadio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormRadioStory: Story = {
  name: 'FormRadio',
  render: () => <SingleFormField field="radio" />,
};
