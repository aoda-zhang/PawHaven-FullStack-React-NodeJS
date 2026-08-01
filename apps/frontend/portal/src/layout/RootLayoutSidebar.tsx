import { Drawer, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const Desktop = useMediaQuery('(min-width: 768px)');

  const navigateAndClose: NavigateFunction = (...args) => {
    onCloseSidebar();
    // @ts-expect-error: react-router types are complex, spreading args is safe
    navigate(...args);
  };

  return (
    <Drawer
      open={Desktop ? false : isSidebarOpen}
      transitionDuration={{
        enter: theme.transitions.duration.enteringScreen,
        exit: Desktop ? 0 : theme.transitions.duration.leavingScreen,
      }}
      anchor="right"
      onClose={onCloseSidebar}
      PaperProps={{ className: 'h-full bg-background text-text p-7' }}
    >
      <div className="flex justify-end px-4 pb-4">
        <LanguageSelector />
      </div>
      <RootLayoutMenuRender menuItems={menuItems} navigate={navigateAndClose} />
    </Drawer>
  );
};
