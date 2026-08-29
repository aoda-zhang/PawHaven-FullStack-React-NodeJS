import '@testing-library/jest-dom/vitest';

import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useMenuVisibility } from '../useMenuVisibility';

const { mockedUseRouterInfo } = vi.hoisted(() => ({
  mockedUseRouterInfo: vi.fn(),
}));

vi.mock('@pawhaven/frontend-core', () => ({
  useRouterInfo: () => mockedUseRouterInfo(),
}));

const renderWithPath = (path: string, handle: Record<string, unknown>) => {
  mockedUseRouterInfo.mockReturnValue({ handle });
  return renderHook(() => useMenuVisibility(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    ),
  });
};

describe('useMenuVisibility', () => {
  it('flags auth on the login page while the DB handle drives the footer', () => {
    const { result } = renderWithPath('/auth/login', {
      isFooterAvailable: true,
    });

    expect(result.current.isFooterAvailable).toBe(true);
    expect(result.current.isAuthPage).toBe(true);
  });

  it('hides the footer on the login page when the DB handle forbids it', () => {
    const { result } = renderWithPath('/auth/login', {
      isFooterAvailable: false,
    });

    expect(result.current.isFooterAvailable).toBe(false);
    expect(result.current.isAuthPage).toBe(true);
  });

  it('flags auth on the register page and keeps the footer handle-driven', () => {
    const { result } = renderWithPath('/auth/register', {
      isFooterAvailable: false,
    });

    expect(result.current.isFooterAvailable).toBe(false);
    expect(result.current.isAuthPage).toBe(true);
  });

  it('keeps the footer and is not flagged as auth on regular pages when the handle allows it', () => {
    const { result } = renderWithPath('/rescues', {
      isFooterAvailable: true,
    });

    expect(result.current.isFooterAvailable).toBe(true);
    expect(result.current.isAuthPage).toBe(false);
  });

  it('keeps the footer hidden on regular pages when the handle forbids it', () => {
    const { result } = renderWithPath('/rescues', {
      isFooterAvailable: false,
    });

    expect(result.current.isFooterAvailable).toBe(false);
    expect(result.current.isAuthPage).toBe(false);
  });

  it('defaults to showing the footer when the handle is absent', () => {
    const { result } = renderWithPath('/rescues', {});

    expect(result.current.isFooterAvailable).toBe(true);
    expect(result.current.isAuthPage).toBe(false);
  });
});
