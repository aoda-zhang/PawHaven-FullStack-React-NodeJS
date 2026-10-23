import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SkeletonStory: Story = {
  name: 'Skeleton',
  render: () => (
    <div className="w-full max-w-md space-y-3">
      <Skeleton className="h-5 w-2/5 rounded" />
      <Skeleton className="h-24 w-full rounded-panel" />
      <Skeleton className="h-4 w-4/5 rounded" />
    </div>
  ),
};
