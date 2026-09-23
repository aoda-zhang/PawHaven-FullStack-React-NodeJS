import type { Request } from 'express';

import type { InternalJwt } from '../../types/index.js';

export type InternalJwtRequest = Request & {
  internalJwt?: InternalJwt;
};
