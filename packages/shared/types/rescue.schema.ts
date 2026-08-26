import { z } from 'zod';

import { AnimalStatusSchema, AnimalStatus } from './animal-status';

const RescueAgeValues = ['baby', 'young', 'adult', 'senior'] as const;

export const RescueAgeSchema = z.enum(RescueAgeValues);

export type RescueAge = z.infer<typeof RescueAgeSchema>;

/**
 * Animal appearance, shared by the report form and the rescue detail contract.
 */
const MaxColorLength = 50;

export const AnimalAppearanceSchema = z.object({
  color: z.string().min(1, 'Color is required').max(MaxColorLength),
  hasInjury: z.boolean(),
  injuryDescription: z.string().optional(),
  otherFeatures: z.string().optional(),
});

/**
 * Create rescue request DTO (POST /core/rescues). Field names map 1:1 to
 * the Prisma model (data is passed straight through).
 */
export const CreateRescueDtoSchema = z.object({
  name: z.string(),
  animalType: z.string(),
  age: RescueAgeSchema.optional(),
  // Structured location stored on the rescue record (Prisma field `locationObj`).
  locationObj: z
    .object({
      address: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  foundTime: z.string().optional(),
  animalStatus: AnimalStatusSchema.optional().default(AnimalStatus.PENDING),
  statusDescription: z.string().optional(),
  reporterPhotos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});

export type CreateRescueDto = z.infer<typeof CreateRescueDtoSchema>;
