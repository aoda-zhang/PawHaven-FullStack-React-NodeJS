import { LanguageSelector } from '@pawhaven/frontend-core';
import { X } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';

import { RootLayoutMenuRender } from './RootLayoutMenuRender';

import type { MenuItemType } from '@/types/LayoutType';

interface RootLayoutSidebarProps {
  menuItems: MenuItemType[];
  navigate: NavigateFunction;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export const RootLayoutSidebar = ({
  menuItems,
  isSidebarOpen,
  onCloseSidebar,
  navigate,
}: RootLayoutSidebarProps) => {
  const navigateAndClose: NavigateFunction = (...args) => {
    onCloseSidebar();
    // @ts-expect-error: react-router types are complex, spreading args is safe
    navigate(...args);
  };

  if (!isSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="bg-background/40 absolute inset-0"
        onClick={onCloseSidebar}
      />
      <aside className="bg-background text-text absolute top-0 right-0 flex h-full w-80 flex-col pt-7 shadow-lg">
        <div className="flex items-center justify-end gap-2 px-4 pb-4">
          <button
            type="button"
            aria-label="Close menu"
            onClick={onCloseSidebar}
            className="text-text-muted hover:text-text rounded p-1 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex justify-end px-4 pb-4">
          <LanguageSelector />
        </div>
        <RootLayoutMenuRender
          menuItems={menuItems}
          navigate={navigateAndClose}
        />
      </aside>
    </div>
  );
};
