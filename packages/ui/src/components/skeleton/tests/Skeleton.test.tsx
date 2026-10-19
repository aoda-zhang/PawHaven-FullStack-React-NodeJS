// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('supports reduced-motion and pulse utility classes', () => {
    const { container } = render(<Skeleton data-testid="skeleton" />);
    expect(container.firstElementChild).toHaveClass('animate-pulse');
    expect(container.firstElementChild).toHaveClass('motion-reduce:animate-none');
  });
  it('forwards div attributes and custom classes', () => {
    const { getByTestId } = render(<Skeleton data-testid="placeholder" className="h-8" aria-label="Loading profile" />);
    expect(getByTestId('placeholder')).toHaveClass('h-8');
    expect(getByTestId('placeholder')).toHaveAttribute('aria-label', 'Loading profile');
  });
});
