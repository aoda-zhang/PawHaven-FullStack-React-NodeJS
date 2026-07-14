import { useRouterInfo } from '@pawhaven/frontend-core';

import type { RouterInfoType } from '@/types/LayoutType';

interface MenuVisibility {
  isMenuAvailable: boolean;
  isFooterAvailable: boolean;
}

export const useMenuVisibility = (): MenuVisibility => {
  const currentRouterInfo = useRouterInfo<RouterInfoType>();
  const { isMenuAvailable = true, isFooterAvailable = true } =
    currentRouterInfo?.handle ?? {};

  return { isMenuAvailable, isFooterAvailable };
};
