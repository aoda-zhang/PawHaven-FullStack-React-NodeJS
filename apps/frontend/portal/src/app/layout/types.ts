export type { MenuItem as MenuItemType } from '@pawhaven/shared/types';

export interface RouterHandle {
  isMenuAvailable?: boolean;
  isFooterAvailable?: boolean;
  isLazyLoad?: boolean;
  isRequireUserLogin?: boolean;
}

export interface RouterItem {
  element: string;
  path: string | null;
  children?: RouterItem[];
  handle: RouterHandle;
}

export type RouterEle = RouterItem;

export interface RouterInfoType {
  data: Record<string, unknown> | undefined;
  handle?: RouterHandle;
  id: string;
  params: Record<string, unknown> | undefined;
  pathname: string;
}
