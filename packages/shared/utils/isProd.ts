/**
 * Checks if the given environment string represents a production environment.
 * `production` is still accepted as a legacy label; `NODE_ENV` runtime values
 * are limited to `dev`, `uat`, `test`, and `prod`.
 *
 * @param env - The environment string to check (e.g., 'prod', 'dev')
 * @returns True if the environment is 'prod' or 'production', false otherwise
 */
export function isProd(env?: string): boolean {
  return env === 'prod' || env === 'production';
}
