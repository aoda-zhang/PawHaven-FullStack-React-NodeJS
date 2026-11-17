export const InternalJwtVerificationErrorCode = {
  MISSING_HEADER: 'missing-header',
  INVALID_ENCODING: 'invalid-encoding',
  INVALID_PAYLOAD: 'invalid-payload',
  UNKNOWN_KEY: 'unknown-key',
  BAD_SIGNATURE: 'bad-signature',
  EXPIRED: 'expired',
  AUDIENCE_MISMATCH: 'audience-mismatch',
  LIFETIME_EXCEEDED: 'lifetime-exceeded',
  NOT_YET_ISSUED: 'not-yet-issued',
} as const;

export type InternalJwtVerificationErrorCode =
  (typeof InternalJwtVerificationErrorCode)[keyof typeof InternalJwtVerificationErrorCode];

export class InternalJwtVerificationError extends Error {
  readonly code: InternalJwtVerificationErrorCode;

  constructor(code: InternalJwtVerificationErrorCode) {
    super(`internal jwt verification failed: ${code}`);
    this.name = 'InternalJwtVerificationError';
    this.code = code;
  }
}
