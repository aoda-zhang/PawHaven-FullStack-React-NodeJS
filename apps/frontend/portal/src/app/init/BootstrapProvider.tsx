import { useSelector } from 'react-redux';

import { useBootstrapQuery } from '@/app/init/bootstrap.queries';
import type { BootstrapScope } from '@/app/init/bootstrap.queryKeys';
import { reducerNames } from '@/app/store/reducerNames';

const isAuthPagePath = (pathname: string): boolean =>
  pathname === '/login' || pathname === '/register';

export const BootstrapProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const profile = useSelector(
    (state: {
      [reducerNames.global]: {
        profile: {
          baseUserInfo: { userID: string; globalMenuUpdateAt: string };
        };
      };
    }) => state[reducerNames.global]?.profile,
  );
  const userID = profile?.baseUserInfo?.userID ?? '';
  const { pathname } = window.location;

  const scope: BootstrapScope = {
    userID,
    menuUpdateAt: profile?.baseUserInfo?.globalMenuUpdateAt ?? '',
  };

  useBootstrapQuery(scope, { enabled: !isAuthPagePath(pathname) });

  return <>{children}</>;
};
