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
const PHOTO = 'report-animal/photo-123.png';
const CLAIMS = { kind: InternalJwtKind.AUTHENTICATED, sub: 'user-1' };
const ANONYMOUS_CLAIMS = { kind: InternalJwtKind.ANONYMOUS };

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
  contactInfo: {},
});

type ErrorBody = { message?: string[] };

const boot = async (claims: typeof CLAIMS | typeof ANONYMOUS_CLAIMS = CLAIMS) => {
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
    Object.assign(req, { internalJwt: claims });
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
      contactInfo: {},
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('animalCount'),
        expect.stringContaining('status'),
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

  it('rejects values that are not storage keys', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      reporterPhotos: ['https://evil.example.com/x.png', '../etc/passwd'],
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('storage key')]),
    );
    expect(booted.create).not.toHaveBeenCalled();
  });

  it('rejects a description over 200 characters', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      description: 'a'.repeat(201),
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('Description too long')]),
    );
    expect(booted.create).not.toHaveBeenCalled();
  });

  it('accepts a location with coordinates', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      location: {
        address: 'Central Park',
        latitude: 40.7829,
        longitude: -73.9654,
      },
    });

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.create).toHaveBeenCalledWith(
      expect.objectContaining({
        location: {
          address: 'Central Park',
          latitude: 40.7829,
          longitude: -73.9654,
        },
      }),
      CLAIMS,
    );
  });

  it('accepts contactInfo with a valid email', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      contactInfo: { email: 'reporter@example.com' },
    });

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactInfo: { email: 'reporter@example.com' },
      }),
      CLAIMS,
    );
  });

  it('rejects contactInfo with an invalid email', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      contactInfo: { email: 'not-an-email' },
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Invalid email address'),
      ]),
    );
    expect(booted.create).not.toHaveBeenCalled();
  });


  it('accepts a guest report without an email address', async () => {
    const booted = await boot(ANONYMOUS_CLAIMS);
    app = booted.app;
    const response = await booted.post(validReport());
    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.create).toHaveBeenCalledWith(validReport(), ANONYMOUS_CLAIMS);
  });

  it('accepts a guest report with an optional email address', async () => {
    const booted = await boot(ANONYMOUS_CLAIMS);
    app = booted.app;
    const guestReport = {
      ...validReport(),
      contactInfo: { email: 'guest@example.com' },
    };

    const response = await booted.post(guestReport);

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.create).toHaveBeenCalledWith(guestReport, ANONYMOUS_CLAIMS);
  });

  it('rejects more than 5 photos', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.post({
      ...validReport(),
      reporterPhotos: Array(6).fill(PHOTO),
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('At most 5 photos are allowed'),
      ]),
    );
    expect(booted.create).not.toHaveBeenCalled();
  });
});
