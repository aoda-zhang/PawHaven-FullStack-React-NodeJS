export { z } from 'zod';
export {
  authConfigSchema,
  corsConfigSchema,
  dbConnectionsSchema,
  emailConfigSchema,
  featureFlagSchema,
  httpConfigSchema,
  internalJwtConfigSchema,
  microServiceConfigSchema,
  requiredInternalJwtSigningSchema,
  requiredInternalJwtVerifyingSchema,
  swaggerConfigSchema,
  throttleConfigSchema,
} from './configSchema.js';
export type { ServiceConfigSchema, EmailConfig } from './configSchema.js';
/** @deprecated use @pawhaven/shared/utils instead */
export {
  ConfigValidationError as ServiceConfigValidationError,
  validateConfig as validateServiceConfig,
  formatConfigIssues,
} from '@pawhaven/shared/utils';
/** @deprecated use @pawhaven/shared/utils instead */
export type {
  ConfigIssue,
  ConfigValidationContext,
} from '@pawhaven/shared/utils';
export { ConfigsModule } from './configs.module.js';
export type { ConfigsModuleOptions } from './configs.module.js';
export {
  collectServiceConfigSources,
  resolveServiceConfig,
} from './serviceConfig.js';
export type {
  ServiceConfig,
  ServiceConfigEnv,
  ServiceConfigSource,
} from './serviceConfig.js';
