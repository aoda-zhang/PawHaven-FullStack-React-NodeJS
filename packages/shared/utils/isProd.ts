/**
 * Checks whether the given environment string is the production environment.
 *
 * @param env - The resolved `http.env` value from the service config bundle
 * @returns True only for 'prod'
 */
export function isProd(env?: string): boolean {
  return env === 'prod';
}
