import { Phase } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Phase> = { title: 'UI/Phase', component: Phase, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
