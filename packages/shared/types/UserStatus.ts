import { z } from 'zod';

export const userStatus = {
  pending: 'pending',
  active: 'active',
} as const;

export const UserStatusSchema = z.enum([userStatus.pending, userStatus.active]);

export type UserStatus = z.infer<typeof UserStatusSchema>;
