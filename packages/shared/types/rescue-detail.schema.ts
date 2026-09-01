import { z } from 'zod';

import { AnimalStatusSchema, AnimalStatus } from './animal-status';
import {
  RescueAgeSchema,
  AnimalAppearanceSchema,
  RescueLocationSchema,
  RescueReporterSchema,
  RescueContactInfoSchema,
} from './rescue.schema';

export const RescueDetailAppearanceSchema = AnimalAppearanceSchema;
export const RescueDetailLocationSchema = RescueLocationSchema;
export const RescueDetailReporterSchema = RescueReporterSchema;
export const RescueDetailContactInfoSchema = RescueContactInfoSchema;

export type RescueDetailAppearance = z.infer<typeof AnimalAppearanceSchema>;
export type RescueDetailLocation = z.infer<typeof RescueLocationSchema>;
export type RescueDetailReporter = z.infer<typeof RescueReporterSchema>;
export type RescueDetailContactInfo = z.infer<typeof RescueContactInfoSchema>;

export const RescueDetailSchema = z.object({
  id: z.string(),
  animalType: z.string(),
  age: RescueAgeSchema,
  status: AnimalStatusSchema.default(AnimalStatus.PENDING),
  statusDescription: z.string().nullish(),
  description: z.string(),
  size: z.string(),
  animalCount: z.number().int(),
  appearance: AnimalAppearanceSchema,
  location: RescueLocationSchema,
  photos: z.array(z.string()).catch([]),
  distance: z.number(),
  reporter: RescueReporterSchema,
  reportedAt: z.string(),
});

export type RescueDetail = z.infer<typeof RescueDetailSchema>;
