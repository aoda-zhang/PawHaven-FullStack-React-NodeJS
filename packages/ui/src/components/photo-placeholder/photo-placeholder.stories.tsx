import { Photo-placeholder } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Photo-placeholder> = { title: 'UI/Photo-placeholder', component: Photo-placeholder, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
