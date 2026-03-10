import { z } from 'zod';

/**
 * Auth schemas used by frontend & backend
 */

export const UserSchema = z.object({
  userId: z.string(),
  email: z.email(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Login Request Schema
 */
export const CredentialsSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CredentialsDto = z.infer<typeof CredentialsSchema>;

/**
 * Refresh Token Request Schema
 */
export const RefreshSchema = z.object({
  refresh_token: z.string(),
});

export type RefreshDto = z.infer<typeof RefreshSchema>;

/**
 * Auth Response Schema
 */
export const AuthResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  user: UserSchema,
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

/**
 * Session Schema (common response for login/register/verify)
 */
export const SessionSchema = z.object({
  user: UserSchema,
  expires_in: z.number(),
});

export type SessionDto = z.infer<typeof SessionSchema>;

/**
 * Auth User Schema
 */
export const AuthUserSchema = UserSchema.extend({
  email: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

/**
 * JWT Verify Info Schema
 */
export const JwtVerifyInfoSchema = UserSchema.extend({
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtVerifyInfo = z.infer<typeof JwtVerifyInfoSchema>;
