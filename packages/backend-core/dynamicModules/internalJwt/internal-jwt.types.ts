import type { Request } from 'express';

import type { InternalJwt } from '../../types';

export type InternalJwtRequest = Request & {
  internalJwt?: InternalJwt;
};
