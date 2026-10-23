import {
  authConfigSchema,
  corsConfigSchema,
  httpConfigSchema,
  microServiceConfigSchema,
  requiredInternalJwtSigningSchema,
  swaggerConfigSchema,
  throttleConfigSchema,
  z,
} from '@pawhaven/backend-core/config-module';

export const gatewayConfigSchema = z.object({
  http: httpConfigSchema,
  swagger: swaggerConfigSchema,
  auth: authConfigSchema,
  identity: z.object({
    refreshPath: z.string().startsWith('/'),
    minimumRefreshWindowSeconds: z.number().int().positive(),
  }),
  internalJwt: requiredInternalJwtSigningSchema,
  throttle: throttleConfigSchema,
  microServices: z.array(microServiceConfigSchema).min(1),
  cors: corsConfigSchema,
});
