import { Loading } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Loading> = { title: 'UI/Loading', component: Loading, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
