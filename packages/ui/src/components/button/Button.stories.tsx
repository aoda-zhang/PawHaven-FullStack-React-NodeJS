import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'md',
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
      {(
        [
          'default',
          'destructive',
          'outline',
          'secondary',
          'ghost',
          'link',
        ] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const SizeGallery: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon button">
        +
      </Button>
    </div>
  ),
};

export const LoadingAndDisabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button asChild disabled>
        <a href="#disabled-link">Disabled link</a>
      </Button>
    </div>
  ),
};
