import type { NavigateFunction } from 'react-router-dom';

import { useMenuNavigation } from './hooks/useMenuNavigation';
import { SidebarMenuItem } from './SidebarMenuItem';

import type { MenuItemType } from '@/types/LayoutType';

interface RootLayoutSidebarProps {
  menuItems: MenuItemType[];
  navigate: NavigateFunction;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  activePath: string;
}

export const RootLayoutSidebar = ({
  menuItems,
  isSidebarOpen,
  onCloseSidebar,
  navigate,
  activePath,
}: RootLayoutSidebarProps) => {
  const navigateAndClose: NavigateFunction = (...args) => {
    onCloseSidebar();
    // @ts-expect-error: react-router types are complex, spreading args is safe
    navigate(...args);
  };

  const { resolvedItems } = useMenuNavigation({
    menuItems,
    activePath,
    navigate,
  });

  if (!isSidebarOpen) return null;

  const authItems = resolvedItems.filter((item) =>
    (item.classNames as string[]).some((c) => c === 'login' || c === 'logout'),
  );
  const navItems = resolvedItems.filter((item) => !authItems.includes(item));

  return (
    <div className="border-border bg-background border-t shadow-lg md:hidden">
      <nav aria-label="Mobile navigation" className="px-3 py-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <SidebarMenuItem item={item} onClick={navigateAndClose} />
            </li>
          ))}
        </ul>
      </nav>
      {authItems.length > 0 && (
        <div className="border-border border-t px-3 py-3">
          {authItems.map((item) => (
            <SidebarMenuItem
              key={item.label}
              item={item}
              onClick={navigateAndClose}
            />
          ))}
        </div>
      )}
    </div>
  );
};
