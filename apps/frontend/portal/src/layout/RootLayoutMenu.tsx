import { LanguageSelector } from '@pawhaven/frontend-core';
import { AlignJustify } from 'lucide-react';
import { useState } from 'react';

import { RootLayoutMenuRender } from './RootLayoutMenuRender';
import { RootLayoutSidebar } from './RootLayoutSidebar';

import { Brand } from '@/components/Brand';
import type { RootLayoutHeaderProps } from '@/types/LayoutType';

export const RootLayoutMenu = ({
  menuItems,
  navigate,
  currentRouterInfo,
}: RootLayoutHeaderProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const onOpenSidebar = () => setSidebarOpen(true);
  const onCloseSidebar = () => setSidebarOpen(false);

  return (
    <header className="flex justify-between items-center box-border border-border border-b px-6 py-4 bg-surface">
      <Brand navigate={navigate} />
      <div className="flex items-center gap-4">
        {/* Desktop: horizontal menu */}
        <RootLayoutMenuRender
          className="hidden lg:flex"
          menuItems={menuItems}
          activePath={currentRouterInfo?.pathname || ''}
          navigate={navigate}
        />
        <div className="hidden lg:flex">
          <LanguageSelector />
        </div>

        {/* Mobile: hamburger */}
        <AlignJustify
          size={34}
          className="lg:hidden cursor-pointer"
          onClick={onOpenSidebar}
        />

        {/* Side bar */}
        <RootLayoutSidebar
          menuItems={menuItems}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={onCloseSidebar}
          navigate={navigate}
        />
      </div>
    </header>
  );
};
