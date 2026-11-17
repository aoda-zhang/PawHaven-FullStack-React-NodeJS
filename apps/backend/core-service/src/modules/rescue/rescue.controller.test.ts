import { StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RescueController } from './rescue.controller.js';
import { RescueService } from './rescue.service.js';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const ROUTE = '/rescues';

type ErrorBody = { message?: string[] };

const boot = async () => {
  const findAll = vi.fn(() => Promise.resolve([]));

  const moduleRef = await Test.createTestingModule({
    controllers: [RescueController],
    providers: [
      { provide: RescueService, useValue: { findAll } },
      { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();

  app.useLogger(false);
  await app.init();
  await app.listen(0);

  const { port } = app.getHttpServer().address() as { port: number };

  const get = (query = '') => fetch(`http://127.0.0.1:${port}${ROUTE}${query}`);

  return { app, findAll, get };
};

describe('RescueController validation', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('passes a public status and limit to the service', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.get('?status=needsHelp&limit=3');

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(booted.findAll).toHaveBeenCalledWith('needsHelp', 3);
  });

  it('passes a non-public status to the service', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.get('?status=pendingReview');

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(booted.findAll).toHaveBeenCalledWith('pendingReview', undefined);
  });

  it('rejects a status outside the enum before the handler runs', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.get('?status=nope');
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('status')]),
    );
    expect(booted.findAll).not.toHaveBeenCalled();
  });

  it('queries without a status when the caller omits one', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.get();

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(booted.findAll).toHaveBeenCalledWith(undefined, undefined);
  });
});
