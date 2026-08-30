import '@testing-library/jest-dom/vitest';

import type { MenuItem } from '@pawhaven/shared/types';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMenuNavigation } from '../useMenuNavigation';

import { authQueryKeys } from '@/features/Auth/api/auth.queryKeys';
import { landingQueryKeys } from '@/features/Landing/api/landing.queryKeys';

const { mockLogout, mockNavigate, mockShowToast, mockInvalidateQueries } =
  vi.hoisted(() => ({
    mockLogout: vi.fn(),
    mockNavigate: vi.fn(),
    mockShowToast: vi.fn(),
    mockInvalidateQueries: vi.fn(),
  }));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@pawhaven/frontend-core', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@pawhaven/ui', () => ({
  showToast: mockShowToast,
}));

vi.mock('@/features/Auth/api/auth.mutations', () => ({
  useLogout: () => ({ mutate: mockLogout, isPending: false }),
}));

const logoutItem: MenuItem = {
  label: 'logout',
  to: '/logout',
  classNames: ['logout'],
  order: 1,
};

const navItem: MenuItem = {
  label: 'rescues',
  to: '/rescues',
  classNames: [],
  order: 0,
};

const renderHookWith = (menuItems: MenuItem[]) =>
  renderHook(() =>
    useMenuNavigation({
      menuItems,
      activePath: '/rescues',
      navigate: mockNavigate,
    }),
  );

describe('useMenuNavigation', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockNavigate.mockReset();
    mockShowToast.mockReset();
    mockInvalidateQueries.mockReset();
  });

  it('triggers logout, redirects to login, then invalidates auth and landing bootstrap queries', () => {
    const { result } = renderHookWith([navItem, logoutItem]);

    act(() => {
      result.current.handleMenuClick(logoutItem);
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    const callOptions = mockLogout.mock.calls[0][1];
    act(() => {
      callOptions.onSuccess();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
      replace: true,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: authQueryKeys.all,
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: landingQueryKeys.all,
    });
  });

  it('shows an error toast and does not navigate when logout fails', () => {
    const { result } = renderHookWith([navItem, logoutItem]);

    act(() => {
      result.current.handleMenuClick(logoutItem);
    });

    const callOptions = mockLogout.mock.calls[0][1];
    act(() => {
      callOptions.onError();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'auth.logout_failed',
    });
  });

  it('navigates to the target route for a regular menu item', () => {
    const { result } = renderHookWith([navItem, logoutItem]);

    act(() => {
      result.current.handleMenuClick(navItem);
    });

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/rescues');
  });
});
