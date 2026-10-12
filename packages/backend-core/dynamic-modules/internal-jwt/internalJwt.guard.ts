import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { httpBusinessMappingCodes } from '@pawhaven/shared';

import { httpHeaders } from '../../constants/httpHeaders.js';
import { InternalJwtKind, type InternalJwt } from '../../types/index.js';
import { AuthMetadataKey } from '../../decorators/authMode.decorator.js';
import { isValidTraceId } from '../../trace/traceContext.js';
import { readHeader } from '../../utils/readHeader.js';

import { InternalJwtVerificationError } from './errors.js';
import type { InternalJwtRequest } from './InternalJwt.types.js';
import { verifyInternalJwt, type VerifyInternalJwtOptions } from './verify.js';

@Injectable()
export class InternalJwtGuard implements CanActivate {
  private readonly logger = new Logger(InternalJwtGuard.name);

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
        const claims = verifyInternalJwt(request.headers, this.verifyOptions);
        request.internalJwt = claims;
        this.reportTraceIdMismatch(request, claims);
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
    this.reportTraceIdMismatch(request, claims);

    if (claims.kind === InternalJwtKind.AUTHENTICATED) {
      return true;
    }

    throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
  }

  /**
   * The `x-trace-id` header and the internal JWT's `rid` claim are minted from
   * the same value, so a disagreement means a caller assembled the two headers
   * inconsistently. That is a diagnosability problem, not an authentication one
   * — `rid` carries no authorization meaning — so it is reported rather than
   * rejected, and the header stays authoritative for the ambient trace id.
   */
  private reportTraceIdMismatch(
    request: InternalJwtRequest,
    claims: InternalJwt,
  ): void {
    const headerTraceId = readHeader(request.headers, httpHeaders.traceId);
    if (!isValidTraceId(headerTraceId) || headerTraceId === claims.rid) {
      return;
    }

    this.logger.warn(
      `Trace id mismatch: header=${headerTraceId} rid=${claims.rid} — continuing with the header`,
    );
  }
}
