import { z } from 'zod';

/**
 * Auth schemas used by frontend & backend
 */

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
  user: z.object({
    id: z.string(),
    email: z.string(),
  }),
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

/**
 * Session Schema (common response for login/register/verify)
 */
export const SessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
  }),
  expires_in: z.number(),
});

export type SessionDto = z.infer<typeof SessionSchema>;

/**
 * JWT Verify Info Schema
 */
export const JwtVerifyInfoSchema = z.object({
  userId: z.string(),
  email: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtVerifyInfo = z.infer<typeof JwtVerifyInfoSchema>;
