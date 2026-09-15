import { Inject } from '@nestjs/common';

import { getPrismaInjectionToken } from './getPrismaInjectionToken.js';

export const InjectPrisma = (name: string) =>
  Inject(getPrismaInjectionToken(name));
