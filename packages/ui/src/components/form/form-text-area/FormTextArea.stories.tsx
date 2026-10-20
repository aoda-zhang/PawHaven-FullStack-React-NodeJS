import type { Meta, StoryObj } from '@storybook/react-vite';

import { SingleFormField } from '../../../../.storybook/FormStoryHarness';

import { FormTextArea } from './FormTextArea';

const meta = {
  title: 'Components/Form/FormTextArea',
  component: FormTextArea,
  tags: ['autodocs'],
  args: {
    name: 'description',
    label: 'Situation details',
  },
} satisfies Meta<typeof FormTextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormTextAreaStory: Story = {
  name: 'FormTextArea',
  render: () => <SingleFormField field="textarea" />,
};
