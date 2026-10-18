import { Outlet } from 'react-router-dom';

import { Login } from './login';
import { Register } from './register';

import { routePaths } from '@/app/router/routePaths';

export const AuthenticatedLayout = () => <Outlet />;

export const loginRoute = {
  path: routePaths.login,
  Component: Login,
  handle: { isMenuAvailable: false, isFooterAvailable: false },
};

export const registerRoute = {
  path: routePaths.register,
  Component: Register,
  handle: { isMenuAvailable: false, isFooterAvailable: false },
};
