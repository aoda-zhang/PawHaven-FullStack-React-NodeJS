import { SystemError } from '@pawhaven/frontend-core';
import { Loading } from '@pawhaven/ui';
import { type ReactNode } from 'react';

import { useGetAppBootstrap } from './api/landing.queries';
import type { LandingDataType } from './landingContext';
import { LandingContext } from './landingContext';

import { RootLayoutFooter } from '@/layout/RootLayoutFooter';
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
      {!isLoading && isError && <SystemError footer={<RootLayoutFooter />} />}
      {!isLoading && !isError && children}
    </LandingContext.Provider>
  );
};
