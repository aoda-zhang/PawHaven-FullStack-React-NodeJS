import type { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';

import { routePaths } from '@/router/routePaths';

interface RequireAuthProps {
  children: React.ReactNode;
  authQuery: () => ReturnType<typeof useQuery>;
}

export const RequireAuth = ({ children, authQuery }: RequireAuthProps) => {
  const location = useLocation();
  const { isLoading, isError } = authQuery();

  if (isLoading) {
    return null;
  }

  if (isError) {
    return (
      <Navigate to={routePaths.login} state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
};
