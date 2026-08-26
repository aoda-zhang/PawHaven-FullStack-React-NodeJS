import { z } from 'zod';

import { AnimalStatusSchema } from './animal-status';

export const RescueListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().optional(),
  status: AnimalStatusSchema,
  urgency: z.enum(['high', 'normal']),
  animalType: z.string(),
  location: z.string(),
  description: z.string(),
  reporter: z.string(),
  reportedAt: z.string(),
  distance: z.number(),
});

export type RescueListItem = z.infer<typeof RescueListItemSchema>;
