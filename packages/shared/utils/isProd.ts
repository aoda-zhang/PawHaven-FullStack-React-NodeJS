export function isProd(env?: string): boolean {
  return env === 'prod' || env === 'production';
}
