import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import {
  createMemoryRouter,
  Link,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import { describe, expect, it } from 'vitest';

const Layout = () => (
  <Suspense fallback={<div>loading-fallback</div>}>
    <Outlet />
  </Suspense>
);

const IndexPage = () => (
  <div>
    <p>index-page</p>
    <Link to="/slow">slow</Link>
  </div>
);

const SlowPage = () => {
  throw new Promise<never>(() => {});
};

const createRouter = () =>
  createMemoryRouter([
    {
      path: '/',
      Component: Layout,
      children: [
        { index: true, Component: IndexPage },
        { path: 'slow', Component: SlowPage },
      ],
    },
  ]);

describe('layout Suspense fallback', () => {
  it('shows the fallback when a suspended navigation runs outside a transition', async () => {
    const user = userEvent.setup();
    const router = createRouter();

    render(<RouterProvider router={router} useTransitions={false} />);

    await user.click(screen.getByRole('link', { name: 'slow' }));

    expect(await screen.findByText('loading-fallback')).toBeInTheDocument();
  });

  it('keeps the previous page when the navigation runs inside a transition', async () => {
    const user = userEvent.setup();
    const router = createRouter();

    render(<RouterProvider router={router} />);

    await user.click(screen.getByRole('link', { name: 'slow' }));

    expect(router.state.location.pathname).toBe('/slow');
    expect(screen.queryByText('loading-fallback')).toBeNull();
    expect(screen.getByText('index-page')).toBeInTheDocument();
  });
});
