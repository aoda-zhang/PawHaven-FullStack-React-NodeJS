import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Carousel } from '../../../packages/ui/src/components/carousel/Carousel';
import { NotificationBanner } from '../../../packages/ui/src/components/notification-banner/NotificationBanner';
import { Toast, showToast } from '../../../packages/ui/src/components/toast/Toast';

const meta = {
  title: 'UI Library/Feedback & Carousel',
} satisfies Meta;

export default meta;
type BannerStory = StoryObj<typeof meta>;

export const NotificationBannerStory: BannerStory = {\n  render: () => (\n    <NotificationBanner\n      banner={{\n        id: 'storybook-maintenance',\n        type: 'info',\n        title: 'Rescue platform update',\n        message: 'The volunteer dashboard will be updated tonight.',\n        dismissible: true,\n        variant: 'standard',\n      }}\n    />\n  ),\n};

export const NotificationBannerVariants: BannerStory = {
  render: () => (
    <div className="space-y-4">
      {(['info', 'success', 'warning', 'error'] as const).map((type) => (
        <NotificationBanner
          key={type}
          banner={{
            id: `storybook-${type}`,
            type,
            title: `${type[0].toUpperCase()}${type.slice(1)} message`,
            message: `This is a ${type} notification banner.`,
            dismissible: true,
            variant: 'outlined',
          }}
        />
      ))}
    </div>
  ),
};

export const ToastStory: BannerStory = {
  name: 'Toast',
  render: function ToastDemo() {
    const [counter, setCounter] = useState(0);
    const notify = (type: 'success' | 'error' | 'info' | 'warning') => {
      setCounter((value) => value + 1);
      showToast({ id: `storybook-${type}-${counter}`, type, message: `This is a ${type} toast.`, duration: 6000 });
    };
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['success', 'info', 'warning', 'error'] as const).map((type) => (
            <button key={type} type="button" className="border-border rounded-md border px-3 py-2 text-sm" onClick={() => notify(type)}>
              Show {type} toast
            </button>
          ))}
        </div>
        <Toast />
      </div>
    );
  },
};

const slide = (title: string, color: string) => ({
  src: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420" viewBox="0 0 960 420"><rect width="960" height="420" fill="${color}"/><circle cx="760" cy="120" r="100" fill="#ffffff" fill-opacity=".16"/><text x="64" y="220" font-size="54" font-family="Arial, sans-serif" fill="#ffffff">${title}</text><text x="64" y="275" font-size="24" font-family="Arial, sans-serif" fill="#ffffff">PawHaven UI component preview</text></svg>`,
  )}`,
  alt: title,
});

export const CarouselStory: BannerStory = {
  name: 'Carousel',
  render: () => (
    <div className="h-64 w-full max-w-3xl overflow-hidden rounded-xl">
      <Carousel
        label="PawHaven showcase carousel"
        images={[
          slide('Rescue', '#315d4a'),
          slide('Care', '#4c6b82'),
          slide('Adoption', '#96744d'),
        ]}
        loop
        showControls
      />
    </div>
  ),
};
