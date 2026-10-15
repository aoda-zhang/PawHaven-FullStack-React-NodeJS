import { Timeline } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Timeline> = { title: 'UI/Timeline', component: Timeline, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
