import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH = 'isOptionalAuth';

export const OptionalAuth = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_OPTIONAL_AUTH, true);
