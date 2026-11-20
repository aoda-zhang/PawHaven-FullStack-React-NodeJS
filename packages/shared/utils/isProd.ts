/**
 * Checks if the given environment string represents a production environment.
 * `APP_ENV` selects the runtime among `dev`, `uat`, `test`, and `prod`;
 * `production` remains accepted as a legacy label.
 *
 * @param env - The environment string to check (e.g., 'prod', 'dev')
 * @returns True if the environment is 'prod' or 'production', false otherwise
 */
export function isProd(env?: string): boolean {
  return env === 'prod' || env === 'production';
}
