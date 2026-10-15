import { Skeleton } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Skeleton> = { title: 'UI/Skeleton', component: Skeleton, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
