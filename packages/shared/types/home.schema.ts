import { z } from 'zod';

import { AdoptablePetSchema } from './adoptable-pet.schema';
import { HeroStatsSchema } from './hero-stats.schema';
import { MenuItemSchema } from './menu.schema';
import { RescueListItemSchema } from './rescue-list.schema';
import { RouterItemSchema } from './router.schema';

export const HomeDataSchema = z.object({
  menus: MenuItemSchema.array(),
  routers: RouterItemSchema.array(),
  heroStats: HeroStatsSchema,
  latestRescues: RescueListItemSchema.array(),
  adoptablePets: AdoptablePetSchema.array(),
});

export type HomeData = z.infer<typeof HomeDataSchema>;
