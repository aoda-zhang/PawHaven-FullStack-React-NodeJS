import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Toast, showToast } from './Toast';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

const TOAST_DURATION_MS = 6000;

const ToastDemo = () => {
  const [counter, setCounter] = useState(0);
  const notify = (type: 'success' | 'error' | 'info' | 'warning') => {
    setCounter((value) => value + 1);
    showToast({
      id: `storybook-${type}-${counter}`,
      type,
      message: `This is a ${type} toast.`,
      duration: TOAST_DURATION_MS,
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['success', 'info', 'warning', 'error'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className="border-border rounded-md border px-3 py-2 text-sm"
            onClick={() => notify(type)}
          >
            Show {type} toast
          </button>
        ))}
      </div>
      <Toast />
    </div>
  );
};

export const ToastStory: Story = {
  name: 'Toast',
  render: () => <ToastDemo />,
};
