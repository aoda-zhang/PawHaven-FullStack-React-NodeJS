/**
 * The only runtime environments PawHaven bundles configuration for.
 *
 * `NODE_ENV` must be one of these values; there are no aliases and no fallback,
 * so a stale value fails fast instead of silently loading another bundle.
 */
export const runtimeEnv = {
  uat: 'uat',
  prod: 'prod',
} as const;

export type RuntimeEnvType = keyof typeof runtimeEnv;
