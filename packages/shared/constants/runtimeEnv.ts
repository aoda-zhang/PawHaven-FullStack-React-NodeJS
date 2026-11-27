/**
 * The runtime environments PawHaven bundles configuration for.
 *
 * `dev` and `test` no longer exist. `production` is kept because Vercel forces
 * `NODE_ENV=production` for both builds and functions and does not allow the
 * project to override it; it resolves to the `prod` bundle. Everything else is
 * rejected, so a stale value fails the boot instead of silently loading a bundle.
 */
export const runtimeEnv = {
  uat: 'uat',
  prod: 'prod',
  production: 'prod',
} as const;

export type RuntimeEnvType = keyof typeof runtimeEnv;
