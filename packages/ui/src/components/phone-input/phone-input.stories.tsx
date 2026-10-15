import { Phone-input } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Phone-input> = { title: 'UI/Phone-input', component: Phone-input, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
