import { z } from 'zod';

import { AdoptablePetSchema } from './adoptable-pet.schema.js';
import { HeroStatsSchema } from './hero-stats.schema.js';
import { RescueListItemSchema } from './rescue-list.schema.js';

export const HomeDataSchema = z.object({
  heroStats: HeroStatsSchema,
  latestRescues: RescueListItemSchema.array(),
  adoptablePets: AdoptablePetSchema.array(),
});

export type HomeData = z.infer<typeof HomeDataSchema>;
