import { z } from 'zod';

import { AnimalStatusSchema, AnimalStatus } from './animal-status';
import { RescueAgeSchema } from './rescue.schema';

export const RescueDetailAppearanceSchema = z.object({
  color: z.string().optional(),
  hasInjury: z.boolean().optional(),
  injuryDescription: z.string().optional(),
  otherFeatures: z.string().optional(),
});

export const RescueDetailLocationSchema = z.object({
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const RescueDetailContactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const RescueDetailReporterSchema = z.object({
  name: z.string().optional(),
  contactInfo: RescueDetailContactInfoSchema.optional(),
});

export const RescueDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  animalType: z.string(),
  age: RescueAgeSchema.optional(),
  foundTime: z.string().optional(),
  status: AnimalStatusSchema.default(AnimalStatus.PENDING),
  statusDescription: z.string().optional(),
  description: z.string().optional(),
  appearance: RescueDetailAppearanceSchema.optional(),
  location: RescueDetailLocationSchema.optional(),
  photos: z.array(z.string()).catch([]),
  videos: z.array(z.string()).catch([]),
  reporter: RescueDetailReporterSchema.optional(),
  reportedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RescueDetail = z.infer<typeof RescueDetailSchema>;
export type RescueDetailAppearance = z.infer<
  typeof RescueDetailAppearanceSchema
>;
export type RescueDetailLocation = z.infer<typeof RescueDetailLocationSchema>;
export type RescueDetailReporter = z.infer<typeof RescueDetailReporterSchema>;
export type RescueDetailContactInfo = z.infer<
  typeof RescueDetailContactInfoSchema
>;
