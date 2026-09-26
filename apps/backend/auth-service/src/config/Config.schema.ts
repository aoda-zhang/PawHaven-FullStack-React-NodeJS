import {
  authConfigSchema,
  corsConfigSchema,
  dbConnectionsSchema,
  httpConfigSchema,
  requiredInternalJwtVerifyingSchema,
  swaggerConfigSchema,
  z,
} from '@pawhaven/backend-core/config-module';

export const authServiceConfigSchema = z.object({
  http: httpConfigSchema,
  swagger: swaggerConfigSchema,
  dbConnections: dbConnectionsSchema,
  cors: corsConfigSchema,
  auth: authConfigSchema,
  internalJwt: requiredInternalJwtVerifyingSchema,
});
