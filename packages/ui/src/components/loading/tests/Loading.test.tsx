// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Loading } from '../Loading';

vi.mock('lottie-react', () => ({
  Lottie: () => <div data-testid="loading-animation" />,
}));

const originalMatchMedia = window.matchMedia;

const setMotionPreference = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
};

afterEach(() => {
  cleanup();
  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  } else {
    Reflect.deleteProperty(window, 'matchMedia');
  }
  vi.clearAllMocks();
});

describe('Loading reduced-motion behavior', () => {
  it('renders a static status label when reduced motion is preferred', () => {
    setMotionPreference(true);

    render(<Loading label="Loading rescue cases" />);

    expect(
      screen.getByRole('status', { name: 'Loading rescue cases' }),
    ).toHaveTextContent('Loading rescue cases');
    expect(screen.queryByTestId('loading-animation')).not.toBeInTheDocument();
  });

  it('uses the Lottie animation when motion is allowed', () => {
    setMotionPreference(false);

    render(<Loading />);

    expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
  });
});
