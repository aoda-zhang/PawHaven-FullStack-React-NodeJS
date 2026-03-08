import type { MenuItem, RouterItem } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

// Fetch menu and router from server side
export const getAppBootstrap = async (): Promise<{
  menus: MenuItem[];
  routers: RouterItem[];
}> => {
  return apiClient.get('core/app/bootstrap');
};
