import {
  authConfigSchema,
  corsConfigSchema,
  dbConnectionsSchema,
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
  internalJwt: requiredInternalJwtSigningSchema,
  throttle: throttleConfigSchema,
  dbConnections: dbConnectionsSchema,
  microServices: z.array(microServiceConfigSchema).min(1),
  cors: corsConfigSchema,
});
