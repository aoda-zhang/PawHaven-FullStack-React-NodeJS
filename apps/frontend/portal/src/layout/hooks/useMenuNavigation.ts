import { cn } from '@pawhaven/frontend-core';
import type { MenuItem } from '@pawhaven/shared/types';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom';

import { MENU_CLASSES, type MenuClassKey } from '../menuClasses';

import { useLogout } from '@/features/Auth/api/auth.mutations';
import { routePaths } from '@/router/routePaths';
import { useGlobalState } from '@/store/globalReducer';

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
  const { profile } = useGlobalState();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const isLoggedIn = !!profile?.baseUserInfo?.userID;

  const resolveClassName = (item: MenuItem) => {
    const classKey = item.classNames as unknown as MenuClassKey;
    const baseClass = MENU_CLASSES[classKey] ?? '';
    const isActive = activePath === item.to;
    const activeClass = isActive ? MENU_CLASSES.activeMenuItem : '';
    return cn(baseClass, activeClass);
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.to === routePaths.login && isLoggedIn && !isLogoutPending) {
      logout();
      return;
    }
    navigate(item.to || '/');
  };

  const resolvedItems = menuItems.map((item) => ({
    ...item,
    className: resolveClassName(item),
    label: t(item.label),
  }));

  return { resolvedItems, handleMenuClick, isLoggedIn };
};
