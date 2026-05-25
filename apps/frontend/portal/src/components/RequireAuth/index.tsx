import { Navigate, useLocation } from 'react-router-dom';

import { useCurrentUser } from '@/features/Auth/apis/queries';
import { routePaths } from '@/router/routePaths';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const { isLoading, isError } = useCurrentUser();

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
