import { runtimeEnv } from '../constants/runtimeEnv.js';
import type { RuntimeEnvType } from '../constants/runtimeEnv.js';

const RUNTIME_ENV_KEYS = Object.keys(runtimeEnv);
const ACCEPTED_RUNTIME_ENVS = RUNTIME_ENV_KEYS.join(', ');

const isRuntimeEnv = (value: string): value is RuntimeEnvType =>
  RUNTIME_ENV_KEYS.includes(value);

/**
 * Resolves an APP_ENV value into a runtime environment.
 * Throws instead of falling back, so a missing or unsupported value stops the
 * process rather than loading the wrong configuration.
 *
 * @param currentRuntimeEnv - Raw APP_ENV value
 * @returns The matching runtime environment
 */
export const getRuntimeEnv = (currentRuntimeEnv?: string): RuntimeEnvType => {
  if (currentRuntimeEnv !== undefined && isRuntimeEnv(currentRuntimeEnv)) {
    return currentRuntimeEnv;
  }

  throw new Error(
    `Invalid APP_ENV "${currentRuntimeEnv ?? '<unset>'}": expected one of ${ACCEPTED_RUNTIME_ENVS}.`,
  );
};
