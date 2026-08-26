import type { HeroStats, MenuItem, RouterItem } from '@pawhaven/shared/types';
import { createContext, useContext } from 'react';

export interface LandingDataType {
  menus: MenuItem[];
  routers: RouterItem[];
  heroStats: HeroStats;
}

export const EMPTY_HERO_STATS: HeroStats = {
  totalRescues: 0,
  totalAdopted: 0,
  totalVolunteers: 0,
};

export const LandingContext = createContext<LandingDataType>({
  menus: [] as MenuItem[],
  routers: [] as RouterItem[],
  heroStats: EMPTY_HERO_STATS,
});

export const useLandingContext = (): LandingDataType => {
  const context = useContext(LandingContext);
  return context;
};
