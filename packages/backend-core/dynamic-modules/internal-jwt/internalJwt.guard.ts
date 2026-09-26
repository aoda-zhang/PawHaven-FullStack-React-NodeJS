import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { httpBusinessMappingCodes } from '@pawhaven/shared';

import { InternalJwtKind, type InternalJwt } from '../../types/index.js';
import { AuthMetadataKey } from '../../decorators/authMode.decorator.js';

import { InternalJwtVerificationError } from './errors.js';
import type { InternalJwtRequest } from './InternalJwt.types.js';
import { verifyInternalJwt, type VerifyInternalJwtOptions } from './verify.js';

@Injectable()
export class InternalJwtGuard implements CanActivate {
  private readonly verifyOptions: VerifyInternalJwtOptions;

  constructor(
    private readonly reflector: Reflector,
    configService: ConfigService,
  ) {
    const publicKeyByKeyId = configService.get<Record<string, string>>(
      'internalJwt.publicKeys',
    );
    if (!publicKeyByKeyId || Object.keys(publicKeyByKeyId).length === 0) {
      throw new Error('internalJwt.publicKeys must be a non-empty keyId map');
    }
    const audience = configService.getOrThrow<string>('internalJwt.audience');
    const ttlSeconds = configService.getOrThrow<number>(
      'internalJwt.ttlSeconds',
    );
    const clockSkewSeconds = configService.getOrThrow<number>(
      'internalJwt.clockSkewSeconds',
    );
    this.verifyOptions = {
      audience,
      publicKeyByKeyId,
      ttlSeconds,
      clockSkewSeconds,
    };
  }

  canActivate(context: ExecutionContext): boolean {
    const metadataTargets = [context.getHandler(), context.getClass()];
    const request = context.switchToHttp().getRequest<InternalJwtRequest>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      AuthMetadataKey.PUBLIC,
      metadataTargets,
    );
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      AuthMetadataKey.OPTIONAL,
      metadataTargets,
    );

    if (isPublic || isOptionalAuth) {
      try {
        request.internalJwt = verifyInternalJwt(
          request.headers,
          this.verifyOptions,
        );
      } catch {
        // anonymous access — claims stay unset
      }
      return true;
    }

    let claims: InternalJwt;
    try {
      claims = verifyInternalJwt(request.headers, this.verifyOptions);
    } catch (error) {
      if (error instanceof InternalJwtVerificationError) {
        throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
      }
      throw error;
    }
    request.internalJwt = claims;

    if (claims.kind === InternalJwtKind.AUTHENTICATED) {
      return true;
    }

    throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
  }
}
