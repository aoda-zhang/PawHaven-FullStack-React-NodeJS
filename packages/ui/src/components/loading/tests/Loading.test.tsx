// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('Loading', () => {
  it('exposes an accessible status label', () => {
    render(<Loading label="Loading rescue data" />);

    expect(
      screen.getByRole('status', { name: 'Loading rescue data' }),
    ).toBeInTheDocument();
  });

  it('plays the animation on a loop', () => {
    render(<Loading />);

    expect(screen.getByTestId('lottie-animation')).toHaveAttribute(
      'data-autoplay',
      'true',
    );
    expect(screen.getByTestId('lottie-animation')).toHaveAttribute(
      'data-loop',
      'true',
    );
  });
});
