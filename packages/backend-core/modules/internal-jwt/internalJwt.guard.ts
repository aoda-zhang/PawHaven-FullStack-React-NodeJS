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

import { httpHeaders } from '../../common/constants/httpHeaders.js';
import { InternalJwtKind, type InternalJwt } from '../../common/types/index.js';
import { AuthMetadataKey } from '../../common/decorators/authMode.decorator.js';
import { isValidTraceId } from '../../infrastructure/observability/tracing/traceContext.js';
import { readHeader } from '../../common/utils/readHeader.js';

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
    const { isPublic, isOptionalAuth } = this.resolveAuthMetadata(context);
    const request = context.switchToHttp().getRequest<InternalJwtRequest>();

    if (isPublic || isOptionalAuth) {
      this.attachOptionalClaims(request);
      return true;
    }

    const claims = this.verifyOrThrow(request);
    this.assertAuthenticated(claims);

    return true;
  }

  private resolveAuthMetadata(context: ExecutionContext): {
    isPublic: boolean | undefined;
    isOptionalAuth: boolean | undefined;
  } {
    const metadataTargets = [context.getHandler(), context.getClass()];

    return {
      isPublic: this.reflector.getAllAndOverride<boolean>(
        AuthMetadataKey.PUBLIC,
        metadataTargets,
      ),
      isOptionalAuth: this.reflector.getAllAndOverride<boolean>(
        AuthMetadataKey.OPTIONAL,
        metadataTargets,
      ),
    };
  }

  private attachOptionalClaims(request: InternalJwtRequest): void {
    try {
      const claims = verifyInternalJwt(request.headers, this.verifyOptions);
      Object.assign(request, { internalJwt: claims });
      this.reportTraceIdMismatch(request, claims);
    } catch {
      // anonymous access — claims stay unset
    }
  }

  private verifyOrThrow(request: InternalJwtRequest): InternalJwt {
    let claims: InternalJwt;
    try {
      claims = verifyInternalJwt(request.headers, this.verifyOptions);
    } catch (error) {
      if (error instanceof InternalJwtVerificationError) {
        throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
      }
      throw error;
    }

    Object.assign(request, { internalJwt: claims });
    this.reportTraceIdMismatch(request, claims);

    return claims;
  }

  private assertAuthenticated(claims: InternalJwt): void {
    if (claims.kind !== InternalJwtKind.AUTHENTICATED) {
      throw new UnauthorizedException(httpBusinessMappingCodes.unauthorized);
    }
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
