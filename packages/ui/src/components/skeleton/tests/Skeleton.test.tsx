// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders a pulsing placeholder', () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    expect(container.firstElementChild).toHaveClass('animate-pulse');
  });
  it('forwards div attributes and custom classes', () => {
    const { getByTestId } = render(
      <Skeleton
        data-testid="placeholder"
        className="h-8"
        aria-label="Loading profile"
      />,
    );
    expect(getByTestId('placeholder')).toHaveClass('h-8');
    expect(getByTestId('placeholder')).toHaveAttribute(
      'aria-label',
      'Loading profile',
    );
  });
  it('announces the loading state by default', () => {
    render(<Skeleton />);

    expect(screen.getByRole('status')).toHaveAccessibleName('Loading');
  });
  it('lets the caller replace the default accessible name', () => {
    render(<Skeleton aria-label="Loading profile" />);

    expect(screen.getByRole('status')).toHaveAccessibleName('Loading profile');
  });
});
