import type { Meta, StoryObj } from '@storybook/react-vite';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormCheckbox } from './FormCheckBox';

const meta = {
  title: 'Components/Form/FormCheckBox',
  component: FormCheckbox,
  tags: ['autodocs'],
  args: {
    name: 'termsAccepted',
    label: 'I confirm these details are accurate',
  },
} satisfies Meta<typeof FormCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormCheckboxStory: Story = {
  name: 'FormCheckbox',
  render: () => <SingleFormField field="checkbox" />,
};
