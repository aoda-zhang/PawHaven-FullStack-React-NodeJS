import { runtimeEnv } from '../constants/runtimeEnv.js';
import type { RuntimeEnvType } from '../constants/runtimeEnv.js';

/**
 * Resolves the runtime environment string from a RuntimeEnvType.
 * Falls back to 'uat' if the provided environment is not found.
 *
 * @param currentRuntimeEnv - The runtime environment type to resolve
 * @returns The resolved runtime environment string
 */
export const getRuntimeEnv = (currentRuntimeEnv: RuntimeEnvType): string => {
  return runtimeEnv?.[currentRuntimeEnv] ?? runtimeEnv.uat;
};
