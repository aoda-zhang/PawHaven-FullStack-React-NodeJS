import type { Meta, StoryObj } from '@storybook/react-vite';

import { PhotoPlaceholder } from './PhotoPlaceholder';

const meta = {
  title: 'Components/PhotoPlaceholder',
  component: PhotoPlaceholder,
  tags: ['autodocs'],
} satisfies Meta<typeof PhotoPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PhotoPlaceholderStory: Story = {
  name: 'PhotoPlaceholder',
  render: () => <PhotoPlaceholder className="h-48 w-72 rounded-panel" />,
};
