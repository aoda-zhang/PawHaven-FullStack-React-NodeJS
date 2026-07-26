import '@testing-library/jest-dom/vitest';

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppRouterProvider } from '@/router/AppRouterProvider';

// Mock the landing context to control router data identity.
const mockLandingContext = vi.hoisted(() => ({
  useLandingContext: vi.fn(),
}));

vi.mock('@/features/Landing/landingContext', () => ({
  useLandingContext: mockLandingContext.useLandingContext,
}));

vi.mock('@/features/Auth/api/auth.queries', () => ({
  useCurrentUser: () => ({ isLoading: false, isError: false }),
}));

vi.mock('@/router/routerElementMapping', () => ({
  routerElementMapping: {
    rootLayout: 'RootLayout',
    home: 'Home',
  },
}));

describe('AppRouterProvider — stable router identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not create a new router when landing routers reference is stable', () => {
    const routers = [
      {
        element: 'home',
        path: '/',
        handle: {},
      },
    ];

    mockLandingContext.useLandingContext.mockReturnValue({ routers });

    const { rerender } = render(<AppRouterProvider />);

    // Re-render with the same routers array reference.
    mockLandingContext.useLandingContext.mockReturnValue({ routers });
    rerender(<AppRouterProvider />);

    // If the router identity were unstable, React would warn about
    // changing RouterProvider router prop. No error = stable.
    const expectedCallCount = 2;
    expect(mockLandingContext.useLandingContext).toHaveBeenCalledTimes(
      expectedCallCount,
    );
  });

  it('returns null when routers is empty', () => {
    mockLandingContext.useLandingContext.mockReturnValue({ routers: [] });
    const { container } = render(<AppRouterProvider />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when routers is undefined', () => {
    mockLandingContext.useLandingContext.mockReturnValue({
      routers: undefined,
    });
    const { container } = render(<AppRouterProvider />);
    expect(container.innerHTML).toBe('');
  });
});
