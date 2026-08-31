import { SystemError } from '@pawhaven/frontend-core';
import { Loading } from '@pawhaven/ui';
import { type ReactNode } from 'react';

import { useGetHomeData } from './api/landing.queries';
import { EMPTY_HERO_STATS, type LandingDataType } from './landingContext';
import { LandingContext } from './landingContext';

import { RootLayoutFooter } from '@/layout/RootLayoutFooter';
import { useGlobalState } from '@/store/globalReducer';

interface LandingProps {
  children: ReactNode;
}
export const Landing = ({ children }: LandingProps) => {
  const { profile } = useGlobalState();
  const homeScope = {
    userID: profile?.baseUserInfo?.userID ?? '',
    menuUpdateAt: profile?.baseUserInfo?.globalMenuUpdateAt ?? '',
    routerUpdateAt: profile?.baseUserInfo?.globalRouterUpdateAt ?? '',
  };
  const { data, isError, isLoading } = useGetHomeData(homeScope);

  const contextValue: LandingDataType = {
    menus: data?.menus ?? [],
    routers: data?.routers ?? [],
    heroStats: data?.heroStats ?? EMPTY_HERO_STATS,
    latestRescues: data?.latestRescues ?? [],
    adoptablePets: data?.adoptablePets ?? [],
  };

  return (
    <LandingContext.Provider value={contextValue}>
      {isLoading && <Loading />}
      {!isLoading && isError && <SystemError footer={<RootLayoutFooter />} />}
      {!isLoading && !isError && children}
    </LandingContext.Provider>
  );
};
