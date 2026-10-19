// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotificationBanner } from '../NotificationBanner';

describe('NotificationBanner', () => {
  it('announces the message and supports dismissal', () => {
    render(
      <NotificationBanner
        banner={{
          id: 'maintenance',
          type: 'warning',
          title: 'Maintenance',
          message: 'Some features may be unavailable.',
          dismissible: true,
        }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Maintenance');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Some features may be unavailable.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
