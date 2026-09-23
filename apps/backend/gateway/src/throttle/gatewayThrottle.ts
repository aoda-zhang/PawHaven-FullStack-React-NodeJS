import type { ExecutionContext } from '@nestjs/common';
import { authRouteSuffixes } from '@pawhaven/backend-core/constants';

export type ThrottleConfig = {
  ttlMs: number;
  limit: number;
  authTtlMs: number;
  authLimit: number;
};

const SENSITIVE_AUTH_SUFFIXES = [
  authRouteSuffixes.login,
  authRouteSuffixes.register,
  authRouteSuffixes.refresh,
];

export const isSensitiveAuthPath = (context: ExecutionContext): boolean => {
  const path =
    context.switchToHttp().getRequest<{ path?: string }>()?.path ?? '';
  return SENSITIVE_AUTH_SUFFIXES.some((suffix) => path.endsWith(suffix));
};
