import type { InternalJwtKind } from '@pawhaven/shared/types';

export type InternalJwtTarget = {
  audience: string;
  privateKey: string;
  keyId: string;
};

export type InternalJwtIdentity =
  | { kind: typeof InternalJwtKind.ANONYMOUS }
  | {
      kind: typeof InternalJwtKind.AUTHENTICATED;
      sub: string;
      email?: string;
      roles?: string[];
    };
