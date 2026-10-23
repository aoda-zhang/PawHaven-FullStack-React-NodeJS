import type { Meta, StoryObj } from '@storybook/react-vite';

import slideData from '../../../.storybook/carouselStorySlides.json';

import { Carousel } from './Carousel';

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  args: {
    images: [],
    label: 'PawHaven showcase carousel',
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const slide = (title: string, color: string) => ({
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420" viewBox="0 0 960 420"><rect width="960" height="420" fill="${color}"/><circle cx="760" cy="120" r="100" fill="${slideData.textColor}" fill-opacity=".16"/><text x="64" y="220" font-size="54" font-family="Arial, sans-serif" fill="${slideData.textColor}">${title}</text><text x="64" y="275" font-size="24" font-family="Arial, sans-serif" fill="${slideData.textColor}">PawHaven UI component preview</text></svg>`,
  )}`,
  alt: title,
});

export const CarouselStory: Story = {
  name: 'Carousel',
  render: () => (
    <div className="h-64 w-full max-w-3xl overflow-hidden rounded-media">
      <Carousel
        label="PawHaven showcase carousel"
        images={slideData.slides.map((entry) =>
          slide(entry.title, entry.color),
        )}
        loop
        showControls
      />
    </div>
  ),
};
