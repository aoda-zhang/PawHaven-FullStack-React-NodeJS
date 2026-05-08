import { z } from 'zod';

/**
 * Rescue schemas shared by frontend & backend
 */

const RescueStatusValues = [
  'pending',
  'inProgress',
  'treated',
  'recovering',
  'awaitingAdoption',
  'adopted',
  'failed',
] as const;

export const RescueStatusSchema = z.enum(RescueStatusValues);

export type RescueStatus = z.infer<typeof RescueStatusSchema>;

/**
 * Rescue item for list display (Home page)
 */
export const RescueItemSchema = z.object({
  animalID: z.string(),
  name: z.string(),
  img: z.string().url(),
  description: z.string(),
  location: z.string(),
  time: z.string(),
  status: RescueStatusSchema,
});

export type RescueItem = z.infer<typeof RescueItemSchema>;

/**
 * Create rescue request DTO
 */
export const CreateRescueDtoSchema = RescueItemSchema.pick({
  animalID: true,
  name: true,
  img: true,
  description: true,
  location: true,
}).extend({
  rescueStatus: RescueStatusSchema.optional().default('pending'),
});

export type CreateRescueDto = z.infer<typeof CreateRescueDtoSchema>;

/**
 * Full rescue detail (RescueDetail page)
 */
export const RescueDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  animalType: z.string(),
  age: z.enum(['baby', 'young', 'adult', 'senior']),
  appearance: z.object({
    color: z.string(),
    hasInjury: z.boolean(),
    injuryDescription: z.string().optional(),
    otherFeatures: z.string().optional(),
  }),
  location: z.object({
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  foundTime: z.string(),
  status: RescueStatusSchema,
  statusDescription: z.string(),
  reporterPhotos: z.array(z.string()),
  videos: z.array(z.string()).optional(),
  reporter: z.object({
    id: z.string(),
    name: z.string(),
    contactInfo: z.object({
      phone: z.string(),
      email: z.string().optional(),
    }),
  }),
  stats: z.object({
    viewCount: z.number(),
    likeCount: z.number(),
    shareCount: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RescueDetail = z.infer<typeof RescueDetailSchema>;
