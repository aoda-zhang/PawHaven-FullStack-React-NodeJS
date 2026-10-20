import type { Meta, StoryObj } from '@storybook/react-vite';

import { Loading } from './Loading';

const meta = {
  title: 'Components/Loading',
  component: Loading,
  tags: ['autodocs'],
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadingStory: Story = {
  name: 'Loading',
  render: () => (
    <Loading
      label="Loading rescue data"
      className="flex min-h-32 items-center justify-center"
    />
  ),
};
