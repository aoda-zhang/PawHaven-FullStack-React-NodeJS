import { Brand, LanguageSelector, cn } from '@pawhaven/frontend-core';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { useMenuNavigation } from './hooks/useMenuNavigation';
import { RootLayoutSidebar } from './RootLayoutSidebar';
import type { MenuItemType } from './types';

interface RootLayoutMenuProps {
  menuItems: MenuItemType[];
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  activePath: string;
}

const AUTH_MENU_CLASS_NAMES = ['login', 'logout'];

const isAuthItem = (item: MenuItemType) =>
  item.classNames.some((className) =>
    AUTH_MENU_CLASS_NAMES.includes(className),
  );

export const RootLayoutMenu = ({
  menuItems,
  navigate,
  activePath,
}: RootLayoutMenuProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const { resolvedItems, handleMenuClick } = useMenuNavigation({
    menuItems,
    activePath,
    navigate,
  });

  const authItems = resolvedItems.filter(isAuthItem);
  const navItems = resolvedItems.filter((item) => !authItems.includes(item));

  return (
    <nav aria-label="Main navigation">
      <div className="mx-auto flex h-10 max-w-6xl items-center px-4 sm:px-8 lg:px-32">
        <Brand navigate={navigate} />

        <div className="flex flex-1 justify-center">
          <div className={cn('flex gap-1', 'hidden md:flex')}>
            {navItems.map((item) => (
              <button
                type="button"
                className={item.className}
                key={item.label}
                onClick={() => handleMenuClick(item)}
                aria-current={activePath === item.to ? 'page' : undefined}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {authItems.length > 0 && (
            <div className={cn('flex gap-1', 'hidden md:flex')}>
              {authItems.map((item) => (
                <button
                  type="button"
                  className={item.className}
                  key={item.label}
                  onClick={() => handleMenuClick(item)}
                  aria-current={activePath === item.to ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="hidden md:flex">
            <LanguageSelector align="end" />
          </div>

          <button
            type="button"
            className="cursor-pointer md:hidden"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            aria-label={
              isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? (
              <X size={34} aria-hidden="true" />
            ) : (
              <Menu size={34} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <RootLayoutSidebar
        menuItems={menuItems}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        navigate={navigate}
        activePath={activePath}
      />
    </nav>
  );
};
