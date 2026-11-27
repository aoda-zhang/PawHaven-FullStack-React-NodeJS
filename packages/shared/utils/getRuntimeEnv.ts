import { runtimeEnv } from '../constants/runtimeEnv.js';
import type { RuntimeEnvType } from '../constants/runtimeEnv.js';

const SUPPORTED = Object.keys(runtimeEnv).join(', ');

/**
 * Resolves the bundled config directory from `NODE_ENV`.
 *
 * Only the supported environments exist. Anything else is a configuration
 * error: guessing a default would hide a misconfigured deployment.
 */
export const getRuntimeEnv = (
  currentRuntimeEnv: string | undefined,
): string => {
  if (!currentRuntimeEnv || !(currentRuntimeEnv in runtimeEnv)) {
    throw new Error(
      `Unsupported NODE_ENV "${currentRuntimeEnv ?? '<unset>'}"; set it to one of: ${SUPPORTED}.`,
    );
  }

  return runtimeEnv[currentRuntimeEnv as RuntimeEnvType];
};
