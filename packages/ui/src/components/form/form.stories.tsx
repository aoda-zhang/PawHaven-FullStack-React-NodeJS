import { Form } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Form> = { title: 'UI/Form', component: Form, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
