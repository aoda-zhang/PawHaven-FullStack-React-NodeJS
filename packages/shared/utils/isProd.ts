/**
 * Checks if the given environment string represents a production environment.
 *
 * @param env - The environment string to check (e.g., 'prod', 'production', 'dev')
 * @returns True if the environment is 'prod' or 'production', false otherwise
 */
export function isProd(env?: string): boolean {
  return env === 'prod' || env === 'production';
}
