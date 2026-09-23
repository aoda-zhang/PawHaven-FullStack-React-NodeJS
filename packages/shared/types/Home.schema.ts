import { z } from 'zod';

import { AdoptablePetSchema } from './AdoptablePet.schema.js';
import { HeroStatsSchema } from './HeroStats.schema.js';
import { RescueListItemSchema } from './RescueList.schema.js';

export const HomeDataSchema = z.object({
  heroStats: HeroStatsSchema,
  latestRescues: RescueListItemSchema.array(),
  adoptablePets: AdoptablePetSchema.array(),
});

export type HomeData = z.infer<typeof HomeDataSchema>;
