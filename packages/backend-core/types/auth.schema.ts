import { UserSchema } from '@pawhaven/shared/types';
import { z } from 'zod';

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  session_expires_at: z.number().optional(),
  user: UserSchema,
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

export const TokenTypeSchema = z.enum(['access', 'refresh']);

export type TokenType = z.infer<typeof TokenTypeSchema>;

export const JwtVerifyInfoSchema = UserSchema.extend({
  type: TokenTypeSchema.optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  sessionExpiresAt: z.number().optional(),
});

export type JwtVerifyInfo = z.infer<typeof JwtVerifyInfoSchema>;
