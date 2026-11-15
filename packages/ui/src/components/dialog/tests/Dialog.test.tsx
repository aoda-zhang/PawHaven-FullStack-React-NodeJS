// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from '../Dialog';

Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  value() { this.setAttribute('open', ''); },
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  value() { this.removeAttribute('open'); },
});

const DialogHarness = ({ onOpenChange = vi.fn() }: { onOpenChange?: (open: boolean) => void }) => {
  const [open, setOpen] = useState(true);
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); onOpenChange(next); }} title="Follow this animal" description="Create an account to keep up with its rescue progress." closeLabel="Close dialog" footer={<button type="button">Sign up</button>} />;
};

describe('Dialog', () => {
  it('renders a labelled modal with its description and footer', () => {
    render(<DialogHarness />);
    expect(screen.getByRole('dialog', { name: 'Follow this animal' })).toHaveAttribute('open');
    expect(screen.getByText('Create an account to keep up with its rescue progress.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('notifies the owner when Escape requests dismissal', () => {
    const onOpenChange = vi.fn();
    render(<DialogHarness onOpenChange={onOpenChange} />);
    fireEvent.cancel(screen.getByRole('dialog'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('notifies the owner when the backdrop is clicked', () => {
    const onOpenChange = vi.fn();
    render(<DialogHarness onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not dismiss when dialog content is clicked', () => {
    const onOpenChange = vi.fn();
    render(<DialogHarness onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('supports content without a description or close button', () => {
    render(<Dialog open onOpenChange={vi.fn()} title="Confirm action">Are you sure?</Dialog>);
    expect(screen.getByRole('dialog', { name: 'Confirm action' })).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();
  });
});
