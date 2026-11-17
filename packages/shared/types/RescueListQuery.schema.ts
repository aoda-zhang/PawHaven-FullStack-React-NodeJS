import { z } from 'zod';

import { AnimalStatusSchema } from './AnimalStatus.js';

export const RescueListQuerySchema = z.object({
  status: AnimalStatusSchema.optional(),
});

export type RescueListQuery = z.infer<typeof RescueListQuerySchema>;
