import { Button, cn } from '@pawhaven/ui';
import type { NavigateFunction } from 'react-router-dom';

import { useMenuNavigation } from './hooks/useMenuNavigation';
import type { MenuItemType } from './types';

interface RootLayoutSidebarProps {
  menuItems: MenuItemType[];
  navigate: NavigateFunction;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  activePath: string;
}

const SIDEBAR_MENU_ITEM_CLASS =
  'flex w-full items-center rounded-button-large px-4 py-3 text-base font-medium transition-colors';

const AUTH_MENU_CLASS_NAMES = ['login', 'logout'];

const isAuthItem = (item: MenuItemType) =>
  item.classNames.some((className) =>
    AUTH_MENU_CLASS_NAMES.includes(className),
  );

export const RootLayoutSidebar = ({
  menuItems,
  isSidebarOpen,
  onCloseSidebar,
  navigate,
  activePath,
}: RootLayoutSidebarProps) => {
  const navigateAndClose = (to: MenuItemType['to']) => {
    onCloseSidebar();
    navigate(to);
  };

  const { resolvedItems } = useMenuNavigation({
    menuItems,
    activePath,
    navigate,
  });

  if (!isSidebarOpen) return null;

  const authItems = resolvedItems.filter(isAuthItem);
  const navItems = resolvedItems.filter((item) => !authItems.includes(item));

  return (
    <div className="border-border bg-background border-t shadow-lg md:hidden">
      <nav aria-label="Mobile navigation" className="px-3 py-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <Button
                variant={isAuthItem(item) ? 'default' : 'ghost'}
                type="button"
                className={cn(
                  SIDEBAR_MENU_ITEM_CLASS,
                  item.className,
                  isAuthItem(item) && 'justify-center',
                  'h-auto',
                )}
                onClick={() => navigateAndClose(item.to)}
              >
                <span>{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      {authItems.length > 0 && (
        <div className="border-border border-t px-3 py-3">
          {authItems.map((item) => (
            <Button
              variant="ghost"
              key={item.label}
              type="button"
              className={cn(
                SIDEBAR_MENU_ITEM_CLASS,
                item.className,
                isAuthItem(item) && 'justify-center',
                'h-auto',
              )}
              onClick={() => navigateAndClose(item.to)}
            >
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
