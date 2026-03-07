import { Loading } from '@pawhaven/ui';
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useVerify } from '../features/Auth/apis/queries';

import { useCurrentRouteMeta } from '@/hooks/useCurrentRouteMeta';
import { routePaths } from '@/router/routePaths';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { routerMeta = {} } = useCurrentRouteMeta();
  const { isSuccess, isLoading } = useVerify(routerMeta);
  if (isLoading) {
    return <Loading />;
  }
  if (routerMeta?.isRequireUserLogin && !isSuccess) {
    return <Navigate to={routePaths.login} replace />;
  }
  return <>{children}</>;
};
