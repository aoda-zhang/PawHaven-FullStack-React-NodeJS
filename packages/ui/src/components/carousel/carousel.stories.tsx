import { Carousel } from './index';
import type { Meta, StoryObj } from '@storybook/react';
const meta: Meta<typeof Carousel> = { title: 'UI/Carousel', component: Carousel, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
