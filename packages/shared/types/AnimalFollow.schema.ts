import { z } from 'zod';

export const AnimalFollowStatusSchema = z.object({
  animalId: z.string(),
  isFollowing: z.boolean(),
  followedAt: z.string().nullable(),
});

export type AnimalFollowStatus = z.infer<typeof AnimalFollowStatusSchema>;

export const AnimalFollowResultSchema = AnimalFollowStatusSchema.extend({
  followerCount: z.number().int(),
});

export type AnimalFollowResult = z.infer<typeof AnimalFollowResultSchema>;
