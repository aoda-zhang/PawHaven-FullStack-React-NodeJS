import { z } from 'zod';

/**
 * Story types shared by frontend & backend
 */

export const StoryTypeValues = [
  'beforeAfter',
  'rescueDocumentary',
  'adoptionDiary',
  'knowledgeSharing',
  'communityStory',
] as const;

export const StoryTypeSchema = z.enum(StoryTypeValues);
export type StoryType = z.infer<typeof StoryTypeSchema>;

export const StorySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(200),
  storyType: StoryTypeSchema,
  beforePhoto: z.string().url().optional(),
  afterPhoto: z.string().url().optional(),
  content: z.string().min(1, 'Content is required'),
  rescueCaseId: z.string(),
  rescueCaseRef: z
    .object({
      animalId: z.string(),
      animalName: z.string(),
      rescueDuration: z.number().optional(), // days
      peopleInvolved: z.number().optional(),
    })
    .optional(),
  tags: z.array(z.string()).max(10),
  authorId: z.string(),
  authorName: z.string(),
  status: z.enum(['draft', 'pendingReview', 'published', 'rejected']),
  stats: z.object({
    likes: z.number().default(0),
    comments: z.number().default(0),
    shares: z.number().default(0),
  }),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
});

export type Story = z.infer<typeof StorySchema>;

export const CreateStoryDtoSchema = StorySchema.pick({
  title: true,
  storyType: true,
  beforePhoto: true,
  afterPhoto: true,
  content: true,
  rescueCaseId: true,
  tags: true,
});

export type CreateStoryDto = z.infer<typeof CreateStoryDtoSchema>;

export const UpdateStoryDtoSchema = CreateStoryDtoSchema.partial();
export type UpdateStoryDto = z.infer<typeof UpdateStoryDtoSchema>;
