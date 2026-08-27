import { Navigate, useLocation } from 'react-router-dom';

import { Loading } from '../Loading';

interface RequireAuthProps {
  children: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  loginPath: string;
}

export const RequireAuth = ({
  children,
  isLoading,
  isError,
  loginPath,
}: RequireAuthProps) => {
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
