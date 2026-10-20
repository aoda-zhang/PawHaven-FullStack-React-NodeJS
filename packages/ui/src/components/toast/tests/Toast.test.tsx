// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { showToast, Toast } from '../Toast';

const dismissAll = () => {
  screen
    .queryAllByRole('button', { name: 'Dismiss notification' })
    .forEach((button) => fireEvent.click(button));
};

afterEach(() => {
  dismissAll();
});

describe('Toast', () => {
  it('keeps a live region mounted before any message is shown', () => {
    const { container } = render(<Toast />);

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('announces informational messages as status updates', () => {
    showToast({
      id: 'ui-library-success',
      message: 'Saved successfully',
      duration: 60000,
    });
    render(<Toast />);

    expect(screen.getByRole('status')).toHaveTextContent('Saved successfully');
  });

  it('announces errors assertively', () => {
    showToast({
      id: 'ui-library-error',
      type: 'error',
      message: 'Unable to save',
      duration: 60000,
    });
    render(<Toast />);

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to save');
  });

  it('exposes the queue as a named region', () => {
    render(<Toast />);

    expect(
      screen.getByRole('region', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });

  it('renders the queue only once when several instances are mounted', () => {
    showToast({
      id: 'ui-library-single',
      message: 'Only once',
      duration: 60000,
    });
    render(
      <>
        <Toast />
        <Toast />
      </>,
    );

    expect(screen.getAllByText('Only once')).toHaveLength(1);
  });

  it('allows a toast to be dismissed and clears its timer', () => {
    showToast({
      id: 'ui-library-dismiss',
      message: 'Dismiss me',
      duration: 60000,
    });
    render(<Toast />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('moves focus to the dismiss control of an assertive toast and returns it', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    showToast({
      id: 'ui-library-focus',
      type: 'error',
      message: 'Unable to save',
      duration: 60000,
    });
    render(<Toast />);

    const dismiss = screen.getByRole('button', {
      name: 'Dismiss notification',
    });
    expect(dismiss).toHaveFocus();

    fireEvent.click(dismiss);

    await waitFor(() => expect(trigger).toHaveFocus());

    trigger.remove();
  });
});
