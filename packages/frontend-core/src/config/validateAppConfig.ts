import {
  validateConfig,
  type ConfigValidationContext,
} from '@pawhaven/shared/utils';
import {
  frontendAppConfigSchema,
  type FrontendAppConfig,
} from './appConfig.schema';

export const FRONTEND_APP_CONFIG_WINDOW_KEY = '__APP_CONFIG__';

export function validateFrontendAppConfig(
  rawConfig: unknown,
  appName: string,
  runtimeEnv: string,
): FrontendAppConfig {
  const context: ConfigValidationContext = {
    serviceName: appName,
    runtimeEnv,
    sources: `window.${FRONTEND_APP_CONFIG_WINDOW_KEY}`,
    config: (rawConfig as Record<string, unknown>) ?? {},
  };
  validateConfig(context, frontendAppConfigSchema);
  return rawConfig as FrontendAppConfig;
}
