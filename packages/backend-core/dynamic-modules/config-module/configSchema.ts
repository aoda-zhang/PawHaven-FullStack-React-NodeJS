import { z } from 'zod';

const INTERNAL_JWT_TTL_MIN_SECONDS = 30;
const INTERNAL_JWT_TTL_MAX_SECONDS = 60;

export const httpConfigSchema = z.object({
  env: z.string().min(1),
  port: z.number().int().positive(),
  prefix: z.string().min(1),
  maxJsonBodySize: z.string().min(1),
  timeout: z.number().int().positive(),
  retryCount: z.number().int().nonnegative(),
  retryDelay: z.number().int().nonnegative(),
  trustProxy: z.number().int().nonnegative().optional(),
});

export const corsConfigSchema = z.object({
  allowedHeaders: z.array(z.string().min(1)).optional(),
  origin: z.array(z.string().min(1)).optional(),
  methods: z.array(z.string().min(1)).optional(),
  exposedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
  credentials: z.boolean().optional(),
  optionsSuccessStatus: z.number().int().optional(),
  maxAge: z.number().int().optional(),
});

export const swaggerConfigSchema = z.object({
  title: z.string().min(1),
  version: z.union([z.string().min(1), z.number()]),
  prefix: z.string().min(1),
  description: z.string().optional(),
});

export const internalJwtConfigSchema = z.object({
  enabled: z.boolean(),
  audience: z.string().min(1),
  keyId: z.string().min(1).optional(),
  ttlSeconds: z
    .number()
    .int()
    .min(INTERNAL_JWT_TTL_MIN_SECONDS)
    .max(INTERNAL_JWT_TTL_MAX_SECONDS),
  clockSkewSeconds: z.number().int().nonnegative(),
  privateKey: z.string().optional(),
  publicKeys: z.record(z.string(), z.string().min(1)).optional(),
});

export const dbConnectionsSchema = z.array(
  z.object({
    enable: z.boolean().optional(),
    options: z.object({
      name: z.string().min(1),
      uri: z.string().min(1),
    }),
  }),
);

export const microServiceConfigSchema = z.object({
  name: z.string().min(1),
  enable: z.boolean().optional(),
  options: z.object({
    host: z.string().min(1),
    port: z.number().int().positive().optional(),
    gatewayPrefix: z.string().min(1).optional(),
    pathRewrite: z.string().min(1).optional(),
  }),
});

export const authConfigSchema = z.object({
  jwtSecret: z.string().min(1),
  jwtExpiresIn: z.number().int().positive(),
  jwtClockTolerance: z.number().int().nonnegative(),
  jwtRefreshFallbackSeconds: z.number().int().positive(),
  jwtRefreshWindowPercentage: z.number(),
  refreshTokenExpiresIn: z.number().int().positive(),
  refreshTokenRotationWindowSeconds: z.number().int().positive(),
  sessionExpiresIn: z.number().int().positive(),
});

export const throttleConfigSchema = z.object({
  ttlMs: z.number().int().positive(),
  limit: z.number().int().positive(),
  authTtlMs: z.number().int().positive(),
  authLimit: z.number().int().positive(),
});

export const featureFlagSchema = z.object({
  latestRescueLimit: z.number().int().positive(),
  adoptablePetLimit: z.number().int().positive(),
});

export const emailConfigSchema = z.object({
  from: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  user: z.string().min(1),
  password: z.string().min(1),
  tls: z.object({ ciphers: z.string().min(1) }).optional(),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export const requiredInternalJwtSigningSchema = internalJwtConfigSchema.refine(
  (value) => Boolean(value.keyId) && Boolean(value.privateKey),
  { message: 'internalJwt requires a non-empty keyId and privateKey' },
);

export const requiredInternalJwtVerifyingSchema =
  internalJwtConfigSchema.refine(
    (value) =>
      Boolean(value.publicKeys && Object.keys(value.publicKeys).length),
    { message: 'internalJwt requires at least one publicKeys entry' },
  );

export type ServiceConfigSchema = z.ZodType;
