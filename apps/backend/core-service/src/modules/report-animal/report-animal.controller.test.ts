import { StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { InternalJwtKind } from '@pawhaven/backend-core/types';
import type { RequestHandler } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReportAnimalController } from './reportAnimal.controller.js';
import { ReportAnimalService } from './reportAnimal.service.js';

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const ROUTE = '/report-animal';
const PHOTO = 'data:image/png;base64,AAAA';
const CLAIMS = { kind: InternalJwtKind.AUTHENTICATED, sub: 'user-1' };

const validReport = () => ({
  animalType: 'cat',
  age: 'baby',
  size: 'small',
  animalCount: 1,
  appearance: { color: 'black' },
  location: { address: 'Central Park' },
  status: 'friendly',
  description: 'Found a stray kitten',
  reporterPhotos: [PHOTO, PHOTO],
  contactInfo: { phone: '12345678' },
});

type ErrorBody = { message?: string[] };

const boot = async () => {
  const create = vi.fn(() => Promise.resolve({ id: 'RPT-0001' }));

  const moduleRef = await Test.createTestingModule({
    controllers: [ReportAnimalController],
    providers: [
      { provide: ReportAnimalService, useValue: { create } },
      { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();

  const attachClaims: RequestHandler = (req, _res, next) => {
    Object.assign(req, { internalJwt: CLAIMS });
    next();
  };
  app.use(attachClaims);
  app.useLogger(false);
  await app.init();
  await app.listen(0);

  const { port } = app.getHttpServer().address() as { port: number };

  const post = (body: unknown) =>
    fetch(`http://127.0.0.1:${port}${ROUTE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  return { app, create, post };
};

describe('ReportAnimalController validation', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('accepts a valid report and hands the parsed dto to the service', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post(validReport());

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.create).toHaveBeenCalledWith(validReport(), CLAIMS);
  });

  it('rejects an invalid report with every issue the caller has to fix', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      animalCount: 0,
      status: 'nope',
      contactInfo: { phone: 'abc' },
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('animalCount'),
        expect.stringContaining('status'),
        expect.stringContaining('contactInfo.phone'),
      ]),
    );
    expect(booted.create).not.toHaveBeenCalled();
  });

  it('enforces the photo limits shared with the form', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      reporterPhotos: [PHOTO],
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('At least 2 photos are required'),
      ]),
    );
  });

  it('strips fields that are not part of the contract', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({ ...validReport(), isAdmin: true });

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.create).toHaveBeenCalledWith(validReport(), CLAIMS);
  });
});
