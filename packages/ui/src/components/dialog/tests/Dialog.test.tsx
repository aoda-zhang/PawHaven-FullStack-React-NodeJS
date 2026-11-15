// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from '../Dialog';

interface DialogHarnessProps {
  onOpenChange?: (open: boolean) => void;
}

const DialogHarness = ({ onOpenChange = vi.fn() }: DialogHarnessProps) => {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        onOpenChange(nextOpen);
      }}
      title="Follow this animal"
      description="Create an account to keep up with its rescue progress."
      closeLabel="Close dialog"
      footer={<button type="button">Sign up</button>}
    />
  );
};

const DialogOpenerHarness = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Follow this animal"
        closeLabel="Close dialog"
      />
    </>
  );
};

describe('Dialog', () => {
  it('renders an accessible modal with its description and footer', () => {
    render(<DialogHarness />);

    expect(
      screen.getByRole('dialog', { name: 'Follow this animal' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create an account to keep up with its rescue progress.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Close dialog' }),
    ).toBeInTheDocument();
  });

  it('dismisses when Escape is pressed', () => {
    const onOpenChange = vi.fn();
    render(<DialogHarness onOpenChange={onOpenChange} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses when the backdrop is pressed', async () => {
    const onOpenChange = vi.fn();
    render(<DialogHarness onOpenChange={onOpenChange} />);

    // DismissableLayer registers its outside-pointerdown listener on a macrotask.
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    act(() => {
      fireEvent.pointerDown(document.body);
      fireEvent.click(document.body);
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns focus to the element that opened it', async () => {
    render(<DialogOpenerHarness />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });

    act(() => {
      opener.focus();
      fireEvent.click(opener);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('does not dismiss when dialog content is clicked', () => {
    const onOpenChange = vi.fn();
    render(<DialogHarness onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('supports content without a description or close button', () => {
    render(
      <Dialog open onOpenChange={vi.fn()} title="Confirm action">
        Are you sure?
      </Dialog>,
    );

    expect(
      screen.getByRole('dialog', { name: 'Confirm action' }),
    ).not.toHaveAttribute('aria-describedby');
    expect(
      screen.queryByRole('button', { name: 'Close dialog' }),
    ).not.toBeInTheDocument();
  });
});
