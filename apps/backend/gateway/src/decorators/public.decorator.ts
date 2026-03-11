import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_API = 'isPublicApi';

export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_PUBLIC_API, true);
