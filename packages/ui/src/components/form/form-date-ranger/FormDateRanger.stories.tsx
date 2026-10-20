import type { Meta, StoryObj } from '@storybook/react-vite';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormDateRanger } from './FormDateRanger';

const meta = {
  title: 'Components/Form/FormDateRanger',
  component: FormDateRanger,
  tags: ['autodocs'],
  args: {
    name: 'rescueWindow',
    label: 'Preferred rescue window',
  },
} satisfies Meta<typeof FormDateRanger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormDateRangerStory: Story = {
  name: 'FormDateRanger',
  render: () => <SingleFormField field="dateRange" />,
};
