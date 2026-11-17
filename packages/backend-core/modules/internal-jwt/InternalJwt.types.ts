import type { Request } from 'express';

import type { InternalJwt } from '../../common/types/index.js';

export type InternalJwtRequest = Request & {
  internalJwt?: InternalJwt;
};
