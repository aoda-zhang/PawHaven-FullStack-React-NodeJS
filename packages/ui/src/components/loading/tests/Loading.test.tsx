// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { Loading } from '../Loading';

vi.mock('lottie-react', () => ({
  Lottie: ({ autoplay, loop }: { autoplay?: boolean; loop?: boolean }) => (
    <div
      data-testid="lottie-animation"
      data-autoplay={String(autoplay)}
      data-loop={String(loop)}
    />
  ),
}));

const originalMatchMedia = window.matchMedia;

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

describe('Loading', () => {
  it('exposes an accessible status label', () => {
    render(<Loading label="Loading rescue data" />);

    expect(
      screen.getByRole('status', { name: 'Loading rescue data' }),
    ).toBeInTheDocument();
  });

  it('does not autoplay animation when reduced motion is preferred', () => {
    window.matchMedia = (() =>
      ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    render(<Loading />);

    expect(screen.getByTestId('lottie-animation')).toHaveAttribute(
      'data-autoplay',
      'false',
    );
    expect(screen.getByTestId('lottie-animation')).toHaveAttribute(
      'data-loop',
      'false',
    );
  });
});
