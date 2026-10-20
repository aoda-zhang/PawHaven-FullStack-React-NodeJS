import type { Meta, StoryObj } from '@storybook/react-vite';

import { NotificationBanner } from './NotificationBanner';

const meta = {
  title: 'Components/NotificationBanner',
  component: NotificationBanner,
  tags: ['autodocs'],
  args: {
    banner: {
      id: 'storybook-maintenance',
      type: 'info',
      title: 'Rescue platform update',
      message: 'The volunteer dashboard will be updated tonight.',
      dismissible: true,
      variant: 'standard',
    },
  },
} satisfies Meta<typeof NotificationBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotificationBannerStory: Story = {
  name: 'Notification Banner',
  render: () => (
    <NotificationBanner
      banner={{
        id: 'storybook-maintenance',
        type: 'info',
        title: 'Rescue platform update',
        message: 'The volunteer dashboard will be updated tonight.',
        dismissible: true,
        variant: 'standard',
      }}
    />
  ),
};

export const NotificationBannerVariants: Story = {
  render: () => (
    <div className="space-y-4">
      {(['info', 'success', 'warning', 'error'] as const).map((type) => (
        <NotificationBanner
          key={type}
          banner={{
            id: `storybook-${type}`,
            type,
            title: `${type[0].toUpperCase()}${type.slice(1)} message`,
            message: `This is a ${type} notification banner.`,
            dismissible: true,
            variant: 'accent',
          }}
        />
      ))}
    </div>
  ),
};
