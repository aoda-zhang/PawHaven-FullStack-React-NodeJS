import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { httpBusinessMappingCodes } from '@pawhaven/shared';
import { InternalJwtKind, type InternalJwt } from '@pawhaven/shared/types';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { HttpExceptionFilter } from '../httpClient/httpExceptionFilter';

import { InternalJwt as InternalJwtParam } from './internal-jwt.decorator';
import type { InternalJwtRequest } from './internal-jwt.types';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_UNAUTHORIZED = 401;
const MS_PER_SECOND = 1000;
const CLAIM_LIFETIME_SECONDS = 30;
const NOW_SECONDS = Math.floor(Date.now() / MS_PER_SECOND);
const STRICT_ROUTE = '/strict';
const ANONYMOUS_ROUTE = '/anonymous-allowed';

const UNAUTHORIZED_BODY = {
  status: HTTP_STATUS_UNAUTHORIZED,
  isSuccess: false,
  message: httpBusinessMappingCodes.unauthorized,
  code: httpBusinessMappingCodes.unauthorized,
  data: null,
};

const claimBase = {
  aud: 'core-service',
  iat: NOW_SECONDS,
  exp: NOW_SECONDS + CLAIM_LIFETIME_SECONDS,
  rid: 'test-rid',
};

const ANONYMOUS_CLAIMS: InternalJwt = {
  kind: InternalJwtKind.ANONYMOUS,
  ...claimBase,
};

const AUTHENTICATED_CLAIMS: InternalJwt = {
  kind: InternalJwtKind.AUTHENTICATED,
  ...claimBase,
  sub: 'user-1',
  email: 'user@example.com',
  roles: ['admin'],
};

@Injectable()
class ClaimsInjectorInterceptor implements NestInterceptor {
  constructor(private readonly claims?: InternalJwt) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<InternalJwtRequest>();

    if (this.claims) {
      request.internalJwt = this.claims;
    }

    return next.handle();
  }
}

@Controller()
class ProbeController {
  @Get(STRICT_ROUTE)
  strict(
    @InternalJwtParam() claims: NonNullable<InternalJwtRequest['internalJwt']>,
  ): { kind: string } {
    return { kind: claims.kind };
  }

  @Get(ANONYMOUS_ROUTE)
  anonymousAllowed(
    @InternalJwtParam({ allowAnonymous: true })
    claims: NonNullable<InternalJwtRequest['internalJwt']>,
  ): { kind: string } {
    return { kind: claims.kind };
  }
}

const boot = async (claims?: InternalJwt): Promise<NestExpressApplication> => {
  const moduleRef = await Test.createTestingModule({
    controllers: [ProbeController],
    providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useLogger(false);
  app.useGlobalInterceptors(new ClaimsInjectorInterceptor(claims));
  await app.init();

  return app;
};

describe('InternalJwt', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('returns the production unauthorized envelope when no claims are attached', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(STRICT_ROUTE);

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(response.body).toEqual(UNAUTHORIZED_BODY);
  });

  it('returns the production unauthorized envelope for anonymous claims on a strict route', async () => {
    app = await boot(ANONYMOUS_CLAIMS);
    const response = await request(app.getHttpServer()).get(STRICT_ROUTE);

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(response.body).toEqual(UNAUTHORIZED_BODY);
  });

  it('resolves the claims and returns 200 for authenticated calls on a strict route', async () => {
    app = await boot(AUTHENTICATED_CLAIMS);
    const response = await request(app.getHttpServer()).get(STRICT_ROUTE);

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.body).toEqual({ kind: InternalJwtKind.AUTHENTICATED });
  });

  it('resolves the claims and returns 200 for anonymous calls when allowAnonymous is set', async () => {
    app = await boot(ANONYMOUS_CLAIMS);
    const response = await request(app.getHttpServer()).get(ANONYMOUS_ROUTE);

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.body).toEqual({ kind: InternalJwtKind.ANONYMOUS });
  });

  it('returns the production unauthorized envelope when claims are missing even with allowAnonymous', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(ANONYMOUS_ROUTE);

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(response.body).toEqual(UNAUTHORIZED_BODY);
  });
});
