import { RouterProvider } from 'react-router-dom';

import { router } from '@/app/router/router';

export const AppRouterProvider = () => {
  return <RouterProvider router={router} />;
};
