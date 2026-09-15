import { cn } from '@pawhaven/frontend-core';
import type { MenuItem } from '@pawhaven/shared/types';
import { showToast } from '@pawhaven/ui';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router-dom';

import { useLogout } from '@/features/Auth/api/auth.mutations';
import { routePaths } from '@/router/routePaths';

const LOGOUT_MENU_CLASS = 'logout';

const ACTION_ITEM_CLASS =
  'px-3 py-2 rounded-lg bg-primary text-white font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors hover:bg-primary/90';

const MENU_CLASSES = {
  menuItem:
    'cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary transition-colors hover:text-foreground hover:bg-muted',
  activeMenuItem: 'bg-accent text-primary',
  login: ACTION_ITEM_CLASS,
  logout: ACTION_ITEM_CLASS,
} as const;

type MenuClassKey = keyof typeof MENU_CLASSES;

/**
 * Checks if a menu item is the logout action.
 *
 * @param item - The menu item to check
 * @returns True if the item has the logout class, false otherwise
 */
const isLogoutItem = (item: MenuItem) =>
  (item.classNames ?? []).includes(LOGOUT_MENU_CLASS);

interface UseMenuNavigationOptions {
  menuItems: MenuItem[];
  activePath: string;
  navigate: NavigateFunction;
}

/**
 * Manages menu navigation logic including logout handling, active states, and translations.
 * Resolves menu item classes, translates labels, and handles navigation/logout actions.
 *
 * @param options - Menu navigation configuration
 * @param options.menuItems - Array of menu items to process
 * @param options.activePath - Current active path for highlighting
 * @param options.navigate - React Router navigate function
 * @returns Processed menu items, click handler, and login state
 */
export const useMenuNavigation = ({
  menuItems,
  activePath,
  navigate,
}: UseMenuNavigationOptions) => {
  const { t } = useTranslation();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();

  const isLoggedIn = menuItems.some(isLogoutItem);

  const handleMenuClick = (item: MenuItem) => {
    if (isLogoutItem(item) && !isLogoutPending) {
      logout(undefined, {
        onSuccess: () => {
          navigate(routePaths.login, { replace: true });
        },
        onError: () => {
          showToast({ type: 'error', message: t('auth.logout_failed') });
        },
      });
      return;
    }
    navigate(item.to || '/');
  };

  const resolvedItems = menuItems.map((item) => {
    const classKey = item.classNames as unknown as MenuClassKey;
    const baseClass = MENU_CLASSES[classKey] ?? '';
    const isActive = activePath === item.to;
    const activeClass = isActive ? MENU_CLASSES.activeMenuItem : '';
    return {
      ...item,
      className: cn(baseClass, activeClass),
      label: t(item.label),
    };
  });

  return { resolvedItems, handleMenuClick, isLoggedIn };
};
