import { z } from 'zod';

export const HeroStatsSchema = z.object({
  totalRescues: z.number(),
  totalAdopted: z.number(),
  totalVolunteers: z.number(),
});

export type HeroStats = z.infer<typeof HeroStatsSchema>;
