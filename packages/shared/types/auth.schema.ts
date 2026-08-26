import { z } from 'zod';

/**
 * Auth schemas used by frontend & backend
 */

export const UserSchema = z.object({
  userId: z.string(),
  email: z.email(),
  roles: z.array(z.string()).optional(),
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
 * JWT token type claim — access tokens and refresh tokens are distinct
 */
export const TokenTypeSchema = z.enum(['access', 'refresh']);

export type TokenType = z.infer<typeof TokenTypeSchema>;

/**
 * JWT Verify Info Schema
 * Claims carried by both access and refresh tokens:
 * - type: token kind ('access' | 'refresh') — enforced at every verification point
 * - jti: unique token id, used for revocation (logout denylist)
 */
export const JwtVerifyInfoSchema = UserSchema.extend({
  type: TokenTypeSchema.optional(),
  jti: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtVerifyInfo = z.infer<typeof JwtVerifyInfoSchema>;
