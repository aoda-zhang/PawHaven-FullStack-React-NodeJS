import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button/Button';
import { Dialog } from './Dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const DialogDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Follow this animal?"
        description="Create an account to follow this animal and keep up with its rescue progress."
        closeLabel="Close dialog"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Maybe later
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              Sign up
            </Button>
          </>
        }
      />
    </>
  );
};

export const DialogStory: Story = { name: 'Dialog', render: () => <DialogDemo /> };
