import { Loading } from '@pawhaven/ui';
import { type ReactNode } from 'react';

import { useGetAppBootstrap } from './apis/queries';
import type { LandingDataType } from './landingContext';
import { LandingContext } from './landingContext';

import { SystemError } from '@/components/SystemError';
import { useGlobalState } from '@/store/globalReducer';

interface LandingProps {
  children: ReactNode;
}
export const Landing = ({ children }: LandingProps) => {
  const { profile } = useGlobalState();
  const bootstrapScope = {
    userID: profile?.baseUserInfo?.userID ?? '',
    menuUpdateAt: profile?.baseUserInfo?.globalMenuUpdateAt ?? '',
    routerUpdateAt: profile?.baseUserInfo?.globalRouterUpdateAt ?? '',
  };
  const { data, isError, isLoading } = useGetAppBootstrap(bootstrapScope);

  const contextValue: LandingDataType = data ?? {
    menus: [],
    routers: [],
  };

  return (
    <LandingContext.Provider value={contextValue}>
      {isLoading && <Loading />}
      {!isLoading && isError && <SystemError />}
      {!isLoading && !isError && children}
    </LandingContext.Provider>
  );
};
