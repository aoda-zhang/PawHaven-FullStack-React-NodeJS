import { LanguageSelector } from '@pawhaven/frontend-core';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { RootLayoutMenuRender } from './RootLayoutMenuRender';
import { RootLayoutSidebar } from './RootLayoutSidebar';

import { Brand } from '@/components/Brand';
import type { MenuItemType } from '@/types/LayoutType';

interface RootLayoutMenuProps {
  menuItems: MenuItemType[];
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  activePath: string;
}

export const RootLayoutMenu = ({
  menuItems,
  navigate,
  activePath,
}: RootLayoutMenuProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const onOpenSidebar = () => setSidebarOpen(true);
  const onCloseSidebar = () => setSidebarOpen(false);

  const navItems = menuItems.filter(
    (item) => !(item.classNames as string[]).includes('login'),
  );
  const loginItem = menuItems.filter((item) =>
    (item.classNames as string[]).includes('login'),
  );

  return (
    <nav aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Brand navigate={navigate} />

        <div className="flex flex-1 justify-center">
          <RootLayoutMenuRender
            className="hidden md:flex"
            menuItems={navItems}
            activePath={activePath}
            navigate={navigate}
          />
        </div>

        <div className="flex items-center gap-2">
          {loginItem.length > 0 && (
            <RootLayoutMenuRender
              className="hidden md:flex"
              menuItems={loginItem}
              activePath={activePath}
              navigate={navigate}
            />
          )}
          <div className="hidden md:flex">
            <LanguageSelector />
          </div>

          <button
            type="button"
            className="cursor-pointer md:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation menu"
            aria-expanded={isSidebarOpen}
          >
            <Menu size={34} aria-hidden="true" />
          </button>
        </div>
      </div>

      <RootLayoutSidebar
        menuItems={menuItems}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={onCloseSidebar}
        navigate={navigate}
      />
    </nav>
  );
};
