// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { showToast, Toast } from '../Toast';

const dismiss = (label: string) => {
  const button = screen.queryByRole('button', { name: label });
  if (button) fireEvent.click(button);
};

afterEach(() => {
  dismiss('Dismiss notification');
});

describe('Toast', () => {
  it('announces informational messages as status updates', () => {
    showToast({ id: 'ui-library-success', message: 'Saved successfully', duration: 60000 });
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

  it('allows a toast to be dismissed and clears its timer', () => {
    showToast({ id: 'ui-library-dismiss', message: 'Dismiss me', duration: 60000 });
    render(<Toast />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });
});
