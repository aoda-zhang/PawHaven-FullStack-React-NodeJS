import {
  corsConfigSchema,
  dbConnectionsSchema,
  emailConfigSchema,
  httpConfigSchema,
  requiredInternalJwtVerifyingSchema,
  swaggerConfigSchema,
  z,
} from '@pawhaven/backend-core/config-module';

export const documentServiceConfigSchema = z.object({
  http: httpConfigSchema,
  swagger: swaggerConfigSchema,
  dbConnections: dbConnectionsSchema,
  cors: corsConfigSchema,
  internalJwt: requiredInternalJwtVerifyingSchema,
  email: emailConfigSchema,
  pdf: z.object({ chromiumExecutablePath: z.string().optional() }).optional(),
});
