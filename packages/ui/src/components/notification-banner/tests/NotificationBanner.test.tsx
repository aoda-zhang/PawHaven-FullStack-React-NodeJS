// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotificationBanner } from '../NotificationBanner';

describe('NotificationBanner', () => {
  it('announces errors and warnings assertively', () => {
    const { rerender } = render(
      <NotificationBanner
        banner={{ type: 'error', message: 'Upload failed.' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed.');

    rerender(
      <NotificationBanner
        banner={{ type: 'warning', message: 'Session expires soon.' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Session expires soon.',
    );
  });

  it('announces info and success updates politely', () => {
    const { rerender } = render(
      <NotificationBanner
        banner={{ type: 'info', message: 'Platform update.' }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Platform update.');

    rerender(
      <NotificationBanner
        banner={{ type: 'success', message: 'Application received.' }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Application received.',
    );
  });

  it('supports dismissal with a title specific label', () => {
    render(
      <NotificationBanner
        banner={{
          title: 'Maintenance',
          message: 'Some features may be unavailable.',
          dismissible: true,
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss Maintenance' }),
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('falls back to a generic dismiss label when there is no title', () => {
    render(
      <NotificationBanner
        banner={{
          message: 'Some features may be unavailable.',
          dismissible: true,
        }}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    ).toBeInTheDocument();
  });

  it('applies the banner id to the element when one is provided', () => {
    render(
      <NotificationBanner
        banner={{ id: 'system-maintenance', type: 'info', message: 'Update.' }}
      />,
    );

    expect(screen.getByRole('status')).toHaveAttribute(
      'id',
      'system-maintenance',
    );
  });

  it('renders a link that announces it opens a new tab', () => {
    render(
      <NotificationBanner
        banner={{
          type: 'info',
          message: 'Read the guide.',
          link: { text: 'Open guide', href: 'https://example.com/guide' },
        }}
      />,
    );

    const link = screen.getByRole('link', { name: /Open guide/ });

    expect(link).toHaveAttribute('href', 'https://example.com/guide');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });

  it('maps the fill and accent variants', () => {
    const { container, rerender } = render(
      <NotificationBanner
        banner={{ type: 'info', message: 'Update.', variant: 'fill' }}
      />,
    );

    expect(container.firstElementChild).toHaveClass('bg-primary/90');

    rerender(
      <NotificationBanner
        banner={{ type: 'info', message: 'Update.', variant: 'accent' }}
      />,
    );

    expect(container.firstElementChild).toHaveClass('border-l-4');
  });
});
