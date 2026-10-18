import { loadConfig } from '@/config';

/**
 * Hook to determine if the current environment is production-like.
 * Returns true for both production (prod) and testing (test) environments.
 */
export const useIsStableEnv = (): boolean => {
  const env = loadConfig()?.env;
  const stableDev = ['prod', 'test'];
  return stableDev.includes(env);
};
