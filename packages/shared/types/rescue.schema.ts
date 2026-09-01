import { z } from 'zod';

import { AnimalStatusSchema, AnimalStatus } from './animal-status';

export const RescueAgeValues = ['baby', 'adult'] as const;

export const RescueAgeSchema = z.enum(RescueAgeValues);

export type RescueAge = z.infer<typeof RescueAgeSchema>;

const MaxColorLength = 50;

export const AnimalAppearanceSchema = z.object({
  color: z.string().min(1, 'Color is required').max(MaxColorLength),
  hasInjury: z.boolean(),
  injuryDescription: z.string().optional(),
});

export const RescueLocationSchema = z.object({
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type RescueLocation = z.infer<typeof RescueLocationSchema>;

export const RescueContactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
});

export type RescueContactInfo = z.infer<typeof RescueContactInfoSchema>;

export const RescueReporterSchema = z.object({
  reporterId: z.string(),
});

export type RescueReporter = z.infer<typeof RescueReporterSchema>;

export const CreateRescueDtoSchema = z.object({
  animalType: z.string(),
  age: RescueAgeSchema,
  locationObj: RescueLocationSchema,
  animalStatus: AnimalStatusSchema.optional().default(AnimalStatus.PENDING),
  statusDescription: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  size: z.string().min(1, 'Size is required'),
  animalCount: z.number().int().min(1, 'Animal count is required'),
  appearance: AnimalAppearanceSchema,
  reporterPhotos: z.array(z.string()),
});

export type CreateRescueDto = z.infer<typeof CreateRescueDtoSchema>;
