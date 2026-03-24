import type { MenuItem, RouterItem } from '@pawhaven/shared/types';
import type { NavigateFunction } from 'react-router-dom';

export interface MenuRenderType {
  menuItems: MenuItem[];
  activePath?: string;
  navigate: NavigateFunction;
}

export interface RouterInfoType extends RouterItem {
  data: Record<string, unknown> | undefined;
  id: string;
  params: Record<string, unknown> | undefined;
  pathname: string;
}
export interface RootLayoutHeaderProps {
  menuItems: MenuItem[];
  navigate: NavigateFunction;
  currentRouterInfo?: RouterInfoType;
}
