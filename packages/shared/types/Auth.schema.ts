import { z } from 'zod';

import { UserStatusSchema } from './UserStatus.js';

/**
 * Auth schemas used by frontend & backend
 */

export const UserSchema = z.object({
  userId: z.string(),
  email: z.email(),
  username: z.string().optional(),
  roles: z.array(z.string()).optional(),
  status: UserStatusSchema,
});

export type User = z.infer<typeof UserSchema>;

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 8;

const isStrongPassword = (value: string): boolean =>
  value.length >= PASSWORD_MIN_LENGTH &&
  value.length <= PASSWORD_MAX_LENGTH &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /[0-9]/.test(value) &&
  /[-_+]/.test(value) &&
  /^[A-Za-z0-9_+-]*$/.test(value);

/**
 * Password policy (shared by login and register)
 */
export const PasswordSchema = z
  .string({ error: 'validation.password.invalid' })
  .refine(isStrongPassword, 'validation.password.invalid');

/**
 * Login & register credentials
 */
export const CredentialsSchema = z.object({
  email: z.email({ message: 'validation.email.invalid' }),
  password: PasswordSchema,
});

export type CredentialsDto = z.infer<typeof CredentialsSchema>;

/**
 * Session Schema (common response for login/register/verify)
 */
export const SessionSchema = z.object({
  user: UserSchema,
  expires_in: z.number(),
  session_expires_at: z.number().optional(),
});

export type SessionDto = z.infer<typeof SessionSchema>;

/**
 * Auth User Schema
 */
export const AuthUserSchema = UserSchema.extend({
  email: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
