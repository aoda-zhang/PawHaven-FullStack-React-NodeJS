import { Toast } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Toast> = { title: 'UI/Toast', component: Toast, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
