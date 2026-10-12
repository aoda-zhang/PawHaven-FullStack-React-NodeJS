import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { httpBusinessMappingCodes } from '@pawhaven/shared';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { HttpExceptionFilter } from './httpExceptionFilter.js';
import { httpHeaders } from '../../constants/httpHeaders.js';
import { runWithTrace } from '../../trace/traceContext.js';

const RAW_ERROR_ROUTE = '/raw-error';
const DOWNSTREAM_ERROR_ROUTE = '/downstream-error';
const HTTP_EXCEPTION_ROUTE = '/http-exception';
const BUSINESS_ERROR_ROUTE = '/business-error';
const PRISMA_UNIQUE_ROUTE = '/prisma-unique';
const PRISMA_NOT_FOUND_ROUTE = '/prisma-not-found';
const PRISMA_INIT_ROUTE = '/prisma-init';
const GENERIC_MESSAGE = 'Internal server error';
const PRISMA_LEAK =
  'Invalid `prisma.user.findUnique()` invocation: empty database name not allowed';

const throwPrisma = (code?: string): never => {
  throw Object.assign(new Error(PRISMA_LEAK), {
    code,
    clientVersion: '6.0.0',
  });
};

@Controller()
class ProbeController {
  @Get(RAW_ERROR_ROUTE)
  rawError(): void {
    throw new Error(PRISMA_LEAK);
  }

  @Get(HTTP_EXCEPTION_ROUTE)
  httpError(): void {
    throw new HttpException(
      'Client supplied bad input',
      HttpStatus.BAD_REQUEST,
    );
  }

  @Get(BUSINESS_ERROR_ROUTE)
  businessError(): void {
    throw new HttpException(
      httpBusinessMappingCodes.unauthorized,
      HttpStatus.UNAUTHORIZED,
    );
  }

  @Get(PRISMA_UNIQUE_ROUTE)
  prismaUnique(): void {
    throwPrisma('P2002');
  }

  @Get(PRISMA_NOT_FOUND_ROUTE)
  prismaNotFound(): void {
    throwPrisma('P2025');
  }

  @Get(PRISMA_INIT_ROUTE)
  prismaInit(): void {
    throwPrisma();
  }

  @Get(DOWNSTREAM_ERROR_ROUTE)
  downstreamError(): void {
    throw new HttpException(
      {
        traceId: 'downstream-hop-trace',
        duration: 12,
        message: 'Service unavailable',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        data: null,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

const boot = async (): Promise<NestExpressApplication> => {
  const moduleRef = await Test.createTestingModule({
    controllers: [ProbeController],
    providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useLogger(false);
  await app.init();

  return app;
};

describe('HttpExceptionFilter', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('never leaks raw internal error messages for non-HttpException errors', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(RAW_ERROR_ROUTE);

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      isSuccess: false,
      message: GENERIC_MESSAGE,
      code: '',
      data: null,
    });
    expect(JSON.stringify(response.body)).not.toContain('prisma');
    expect(JSON.stringify(response.body)).not.toContain('findUnique');
  });

  it('returns the intended message for HttpException errors', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(
      HTTP_EXCEPTION_ROUTE,
    );

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toBe('Client supplied bad input');
  });

  it('maps business codes into the code field for HttpException errors', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(
      BUSINESS_ERROR_ROUTE,
    );

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.code).toBe(httpBusinessMappingCodes.unauthorized);
  });

  it('maps Prisma unique-constraint (P2002) to a safe 409 without leaking', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(
      PRISMA_UNIQUE_ROUTE,
    );

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body).toEqual({
      status: HttpStatus.CONFLICT,
      isSuccess: false,
      message: 'Resource already exists',
      code: '',
      data: null,
    });
    expect(JSON.stringify(response.body)).not.toContain('prisma');
    expect(JSON.stringify(response.body)).not.toContain('findUnique');
  });

  it('maps Prisma record-not-found (P2025) to a safe 404 without leaking', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(
      PRISMA_NOT_FOUND_ROUTE,
    );

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(response.body.message).toBe('Resource not found');
    expect(JSON.stringify(response.body)).not.toContain('prisma');
  });

  it('keeps other Prisma errors (e.g. init failure) generic and non-leaking', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(PRISMA_INIT_ROUTE);

    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body.message).toBe(GENERIC_MESSAGE);
    expect(JSON.stringify(response.body)).not.toContain('prisma');
    expect(JSON.stringify(response.body)).not.toContain('findUnique');
  });

  it('omits traceId entirely when there is no trace context', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(RAW_ERROR_ROUTE);

    expect(response.body).not.toHaveProperty('traceId');
    expect(response.headers[httpHeaders.traceId]).toBeUndefined();
  });

  it('echoes the ambient trace id on the header and in the body', async () => {
    app = await boot();
    const response = await runWithTrace('ambient-trace', () =>
      request(app!.getHttpServer()).get(RAW_ERROR_ROUTE),
    );

    expect(response.headers[httpHeaders.traceId]).toBe('ambient-trace');
    expect(response.body.traceId).toBe('ambient-trace');
  });

  it('prefers the failed downstream hop trace id over the ambient one', async () => {
    app = await boot();

    // This is the shape `HttpClientInstance` throws when a service-to-service
    // call fails: the payload carries the trace id of the call that broke.
    const response = await runWithTrace('ambient-trace', () =>
      request(app!.getHttpServer()).get(DOWNSTREAM_ERROR_ROUTE),
    );

    expect(response.body.traceId).toBe('downstream-hop-trace');
    expect(response.headers[httpHeaders.traceId]).toBe('downstream-hop-trace');
  });

  it('falls back to the ambient trace id when the exception carries none', async () => {
    app = await boot();
    const response = await runWithTrace('ambient-trace', () =>
      request(app!.getHttpServer()).get(HTTP_EXCEPTION_ROUTE),
    );

    expect(response.body.traceId).toBe('ambient-trace');
  });

  it('does not let an exception payload corrupt an unrelated error response', async () => {
    app = await boot();
    const response = await request(app.getHttpServer()).get(
      PRISMA_UNIQUE_ROUTE,
    );

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body).not.toHaveProperty('traceId');
  });
});
