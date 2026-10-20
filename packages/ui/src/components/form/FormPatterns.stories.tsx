import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  FormControlVariantsDemo,
  FormPatternsDemo,
} from '../../../.storybook/FormStoryHarness';

const meta = {
  title: 'Components/Form/FormPatterns',
  component: FormPatternsDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Interactive examples for every React Hook Form pattern exported by @pawhaven/ui/form. Values are local to this Storybook preview and are not submitted to any backend.',
      },
    },
  },
} satisfies Meta<typeof FormPatternsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllFormComponents: Story = {};

export const MobileFormLayout: Story = {
  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false,
    },
  },
};

export const TabletFormLayout: Story = {
  globals: {
    viewport: {
      value: 'tablet',
      isRotated: false,
    },
  },
};

export const FormControlVariants: Story = {
  render: () => <FormControlVariantsDemo />,
};
