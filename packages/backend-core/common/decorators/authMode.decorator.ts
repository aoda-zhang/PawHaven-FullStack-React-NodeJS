import { SetMetadata } from '@nestjs/common';

export const AuthMetadataKey = {
  PUBLIC: 'authPublic',
  OPTIONAL: 'authOptional',
} as const;

export const Public = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(AuthMetadataKey.PUBLIC, true);

export const OptionalAuth = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(AuthMetadataKey.OPTIONAL, true);
