import { cn } from '@pawhaven/frontend-core';
import type { MenuItem } from '@pawhaven/shared/types';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom';

import { MENU_CLASSES, type MenuClassKey } from '../menuClasses';

import { useLogout } from '@/features/Auth/api/auth.mutations';

const LOGOUT_MENU_CLASS = 'logout';

const isLogoutItem = (item: MenuItem) =>
  (item.classNames ?? []).includes(LOGOUT_MENU_CLASS);

interface UseMenuNavigationOptions {
  menuItems: MenuItem[];
  activePath: string;
  navigate: NavigateFunction;
}

export const useMenuNavigation = ({
  menuItems,
  activePath,
  navigate,
}: UseMenuNavigationOptions) => {
  const { t } = useTranslation();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  // The backend swaps the login item for a `logout` one based on the session
  // cookie, so the menu itself is the only trustworthy auth signal.
  const isLoggedIn = useMemo(() => menuItems.some(isLogoutItem), [menuItems]);

  const handleMenuClick = useCallback(
    (item: MenuItem) => {
      if (isLogoutItem(item) && !isLogoutPending) {
        logout();
        return;
      }
      navigate(item.to || '/');
    },
    [isLogoutPending, logout, navigate],
  );

  const resolvedItems = useMemo(
    () =>
      menuItems.map((item) => {
        const classKey = item.classNames as unknown as MenuClassKey;
        const baseClass = MENU_CLASSES[classKey] ?? '';
        const isActive = activePath === item.to;
        const activeClass = isActive ? MENU_CLASSES.activeMenuItem : '';
        return {
          ...item,
          className: cn(baseClass, activeClass),
          label: t(item.label),
        };
      }),
    [menuItems, activePath, t],
  );

  return { resolvedItems, handleMenuClick, isLoggedIn };
};
