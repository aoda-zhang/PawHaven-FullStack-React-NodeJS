import { z } from 'zod';

export const InternalJwtKindValues = ['anonymous', 'authenticated'] as const;

export const InternalJwtKindSchema = z.enum(InternalJwtKindValues);

export type InternalJwtKind = z.infer<typeof InternalJwtKindSchema>;

export const InternalJwtKind = {
  ANONYMOUS: 'anonymous',
  AUTHENTICATED: 'authenticated',
} as const;

const InternalJwtBaseSchema = z.object({
  kind: InternalJwtKindSchema,
  aud: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
  rid: z.string().min(1),
});

const AnonymousInternalJwtSchema = InternalJwtBaseSchema.extend({
  kind: z.literal(InternalJwtKind.ANONYMOUS),
});

const AuthenticatedInternalJwtSchema = InternalJwtBaseSchema.extend({
  kind: z.literal(InternalJwtKind.AUTHENTICATED),
  sub: z.string().min(1),
  email: z.email().optional(),
  roles: z.array(z.string()).optional(),
});

export const InternalJwtSchema = z.discriminatedUnion('kind', [
  AnonymousInternalJwtSchema,
  AuthenticatedInternalJwtSchema,
]);

export type InternalJwt = z.infer<typeof InternalJwtSchema>;

export type AuthenticatedInternalJwt = Extract<
  InternalJwt,
  { kind: typeof InternalJwtKind.AUTHENTICATED }
>;
