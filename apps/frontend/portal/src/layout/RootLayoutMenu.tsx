import { useMatchBreakpoint } from '@pawhaven/design-tokens/useMatchBreakpoint';
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
  const enableSidebarMode = useMatchBreakpoint('lg');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const onOpenSidebar = () => setSidebarOpen(true);
  const onCloseSidebar = () => setSidebarOpen(false);

  return (
    <header className="flex justify-between items-center box-border z-header border-border border-b-1 px-6 py-4 bg-white">
      <Brand navigate={navigate} />
      <div className="flex items-center gap-4">
        {!enableSidebarMode && (
          <RootLayoutMenuRender
            menuItems={menuItems}
            activePath={currentRouterInfo?.pathname || ''}
            navigate={navigate}
          />
        )}

        {!enableSidebarMode && <LanguageSelector />}

        {/* Open Side bar Icon */}
        {enableSidebarMode && (
          <AlignJustify size={34} onClick={onOpenSidebar} />
        )}
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
