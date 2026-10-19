import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../../../packages/ui/src/components/button/Button';

const meta = {
  title: 'UI Library/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    loading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const VariantGallery: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const).map((variant) => (
        <Button key={variant} variant={variant}>{variant}</Button>
      ))}
    </div>
  ),
};

export const LoadingAndDisabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button asChild disabled><a href="#disabled-link">Disabled link</a></Button>
    </div>
  ),
};
