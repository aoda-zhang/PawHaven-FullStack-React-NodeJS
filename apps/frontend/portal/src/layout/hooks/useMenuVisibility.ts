import { useRouterInfo } from '@pawhaven/frontend-core';
import { useLocation } from 'react-router-dom';

import { routePaths } from '@/router/routePaths';
import type { RouterInfoType } from '@/types/LayoutType';

interface MenuVisibility {
  isMenuAvailable: boolean;
  isFooterAvailable: boolean;
  isAuthPage: boolean;
}

const AUTH_PAGE_PATHS = [routePaths.login, routePaths.register];

export const useMenuVisibility = (): MenuVisibility => {
  const currentRouterInfo = useRouterInfo<RouterInfoType>();
  const { pathname } = useLocation();
  const { isMenuAvailable = true, isFooterAvailable = true } =
    currentRouterInfo?.handle ?? {};

  const isAuthPage = AUTH_PAGE_PATHS.includes(pathname);

  return {
    isMenuAvailable,
    isFooterAvailable,
    isAuthPage,
  };
};
