import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { httpBusinessMappingCodes } from '@pawhaven/shared';

import { InternalJwtKind } from '../../types/index.js';

import type { InternalJwtRequest } from './InternalJwt.types.js';

type InternalJwtDecoratorOptions = {
  allowAnonymous?: boolean;
};

const internalJwtParam = createParamDecorator(
  (
    options: InternalJwtDecoratorOptions,
    context: ExecutionContext,
  ): NonNullable<InternalJwtRequest['internalJwt']> => {
    const request = context.switchToHttp().getRequest<InternalJwtRequest>();
    const claims = request.internalJwt;

    if (!claims) {
      throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
    }

    if (
      !options.allowAnonymous &&
      claims.kind !== InternalJwtKind.AUTHENTICATED
    ) {
      throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
    }

    return claims;
  },
);

export const InternalJwt = (
  options: InternalJwtDecoratorOptions = {},
): ParameterDecorator => internalJwtParam(options);
