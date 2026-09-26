import {
  corsConfigSchema,
  dbConnectionsSchema,
  featureFlagSchema,
  httpConfigSchema,
  internalJwtConfigSchema,
  microServiceConfigSchema,
  swaggerConfigSchema,
  z,
} from '@pawhaven/backend-core/config-module';

export const coreServiceConfigSchema = z.object({
  http: httpConfigSchema,
  swagger: swaggerConfigSchema,
  featureFlag: featureFlagSchema,
  dbConnections: dbConnectionsSchema,
  cors: corsConfigSchema,
  internalJwt: internalJwtConfigSchema.refine(
    (value) => Boolean(value.keyId) && Boolean(value.audience),
    { message: 'internalJwt requires a non-empty keyId and audience' },
  ),
  microServices: z.array(microServiceConfigSchema).min(1),
});
