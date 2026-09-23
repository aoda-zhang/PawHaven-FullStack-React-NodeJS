import { StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { InternalJwtKind } from '@pawhaven/backend-core/types';
import type { AnimalFollowResult } from '@pawhaven/shared/types';
import type { RequestHandler } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnimalFollowController } from './animalFollow.controller.js';
import { AnimalFollowService } from './animalFollow.service.js';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_UNAUTHORIZED = 401;
const BASE_ROUTE = '/animal-follow';
const ANIMAL_ID = 'animal-1';
const FOLLOWED_AT = '2026-09-01T10:00:00.000Z';

const AUTHENTICATED_CLAIMS = {
  kind: InternalJwtKind.AUTHENTICATED,
  sub: 'user-1',
};
const ANONYMOUS_CLAIMS = { kind: InternalJwtKind.ANONYMOUS };

const boot = async (claims: Record<string, unknown> = AUTHENTICATED_CLAIMS) => {
  const follow = vi.fn(() =>
    Promise.resolve({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT,
      followerCount: 4,
    }),
  );
  const unfollow = vi.fn(() =>
    Promise.resolve({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 3,
    }),
  );
  const getStatus = vi.fn<() => Promise<AnimalFollowResult>>(() =>
    Promise.resolve({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    }),
  );

  const moduleRef = await Test.createTestingModule({
    controllers: [AnimalFollowController],
    providers: [
      {
        provide: AnimalFollowService,
        useValue: {
          follow,
          unfollow,
          getStatus,
        },
      },
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

  const send = (method: string, path: string, body?: Record<string, unknown>) =>
    fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      ...(body
        ? {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }
        : {}),
    });

  return {
    app,
    follow,
    unfollow,
    getStatus,
    send,
  };
};

describe('AnimalFollowController routes', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('follows an animal for the authenticated subject', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.send('POST', `${BASE_ROUTE}/${ANIMAL_ID}`);
    const body = await response.json();

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(body).toEqual({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT,
      followerCount: 4,
    });
    expect(booted.follow).toHaveBeenCalledWith(ANIMAL_ID, AUTHENTICATED_CLAIMS);
  });

  it('unfollows an animal for the authenticated subject', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.send('PUT', `${BASE_ROUTE}/${ANIMAL_ID}`);
    const body = await response.json();

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(body).toEqual({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 3,
    });
    expect(booted.unfollow).toHaveBeenCalledWith(
      ANIMAL_ID,
      AUTHENTICATED_CLAIMS,
    );
  });

  it('reads the follow status from the static sub-path, not the bare id route', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.send(
      'GET',
      `${BASE_ROUTE}/${ANIMAL_ID}/status`,
    );

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(booted.getStatus).toHaveBeenCalledWith(
      ANIMAL_ID,
      AUTHENTICATED_CLAIMS,
    );
  });

  it('serves the stored follow state and follower count to an authenticated caller', async () => {
    const booted = await boot();
    app = booted.app;
    booted.getStatus.mockResolvedValue({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT,
      followerCount: 4,
    });

    const response = await booted.send(
      'GET',
      `${BASE_ROUTE}/${ANIMAL_ID}/status`,
    );
    const body = await response.json();

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(body).toEqual({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT,
      followerCount: 4,
    });
    expect(booted.getStatus).toHaveBeenCalledWith(
      ANIMAL_ID,
      AUTHENTICATED_CLAIMS,
    );
  });

  it('rejects an anonymous caller on the authenticated write route', async () => {
    const booted = await boot(ANONYMOUS_CLAIMS);
    app = booted.app;

    const response = await booted.send('POST', `${BASE_ROUTE}/${ANIMAL_ID}`);

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(booted.follow).not.toHaveBeenCalled();
  });

  it('serves the status route to an anonymous caller as not following', async () => {
    const booted = await boot(ANONYMOUS_CLAIMS);
    app = booted.app;

    const response = await booted.send(
      'GET',
      `${BASE_ROUTE}/${ANIMAL_ID}/status`,
    );
    const body = await response.json();

    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(body).toEqual({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    });
    expect(booted.getStatus).toHaveBeenCalledWith(ANIMAL_ID, ANONYMOUS_CLAIMS);
  });

  it('rejects an anonymous caller on the unfollow route', async () => {
    const booted = await boot(ANONYMOUS_CLAIMS);
    app = booted.app;

    const response = await booted.send('PUT', `${BASE_ROUTE}/${ANIMAL_ID}`);

    expect(response.status).toBe(HTTP_STATUS_UNAUTHORIZED);
    expect(booted.unfollow).not.toHaveBeenCalled();
  });

  it('ignores a user id supplied in the request body', async () => {
    const booted = await boot();
    app = booted.app;

    const response = await booted.send('POST', `${BASE_ROUTE}/${ANIMAL_ID}`, {
      userId: 'spoofed-user',
    });

    expect(response.status).toBe(HTTP_STATUS_CREATED);
    expect(booted.follow).toHaveBeenCalledWith(ANIMAL_ID, AUTHENTICATED_CLAIMS);
  });
});
