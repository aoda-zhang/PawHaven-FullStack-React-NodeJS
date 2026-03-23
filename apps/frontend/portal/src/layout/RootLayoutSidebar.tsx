import { Drawer } from '@mui/material';
import { LanguageSelector } from '@pawhaven/frontend-core';
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
  return (
    <Drawer
      open={isSidebarOpen}
      anchor="right"
      onClose={onCloseSidebar}
      PaperProps={{ className: 'h-full bg-background text-text pt-7' }}
    >
      <div className="px-4 pb-4 flex justify-end">
        <LanguageSelector />
      </div>
      <RootLayoutMenuRender menuItems={menuItems} navigate={navigate} />
    </Drawer>
  );
};
