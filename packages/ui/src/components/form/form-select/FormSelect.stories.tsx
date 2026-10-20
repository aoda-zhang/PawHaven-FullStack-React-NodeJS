import type { Meta, StoryObj } from '@storybook/react-vite';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormSelect } from './FormSelect';

const meta = {
  title: 'Components/Form/FormSelect',
  component: FormSelect,
  tags: ['autodocs'],
  args: {
    name: 'animalType',
    label: 'Animal type',
    options: [
      { label: 'Dog', value: 'dog' },
      { label: 'Cat', value: 'cat' },
      { label: 'Other', value: 'other' },
    ],
  },
} satisfies Meta<typeof FormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormSelectStory: Story = {
  name: 'FormSelect',
  render: () => <SingleFormField field="select" />,
};
