import { BadRequestException, Logger } from '@nestjs/common';
import { InternalJwtKind } from '@pawhaven/backend-core/types';
import type {
  AuthenticatedInternalJwt,
  InternalJwt,
} from '@pawhaven/backend-core/types';
import { Prisma } from '@prismaClient/index.js';
import { describe, expect, it, vi } from 'vitest';

import { AnimalFollowService } from './animalFollow.service.js';

const USER_ID = 'user-1';
const ANIMAL_ID = 'animal-1';
const FOLLOWED_AT = new Date('2026-09-01T10:00:00.000Z');

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
  });

const claims = {
  kind: InternalJwtKind.AUTHENTICATED,
  sub: USER_ID,
} as unknown as AuthenticatedInternalJwt;

const anonymousClaims = {
  kind: InternalJwtKind.ANONYMOUS,
} as unknown as InternalJwt;

type FollowRecord = {
  id: string;
  userId: string;
  animalId: string;
  createdAt: Date;
};

type FollowRow = Partial<FollowRecord> & { createdAt: Date };

const buildService = () => {
  const upsert = vi.fn<() => Promise<FollowRecord>>(() =>
    Promise.resolve({
      id: 'follow-1',
      userId: USER_ID,
      animalId: ANIMAL_ID,
      createdAt: FOLLOWED_AT,
    }),
  );
  const deleteMany = vi.fn<() => Promise<{ count: number }>>(() =>
    Promise.resolve({ count: 1 }),
  );
  const findUnique = vi.fn<() => Promise<FollowRow | null>>(() =>
    Promise.resolve(null),
  );
  const findMany = vi.fn<() => Promise<FollowRecord[]>>(() =>
    Promise.resolve([]),
  );
  const count = vi.fn<() => Promise<number>>(() => Promise.resolve(0));

  const service = new AnimalFollowService({
    animalFollow: { upsert, deleteMany, findUnique, findMany, count },
  } as never);

  return { service, upsert, deleteMany, findUnique, findMany, count };
};

describe('AnimalFollowService.follow', () => {
  it('upserts on the compound key scoped to the jwt subject', async () => {
    const { service, upsert } = buildService();

    await service.follow(ANIMAL_ID, claims);

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_animalId: { userId: USER_ID, animalId: ANIMAL_ID } },
      create: { userId: USER_ID, animalId: ANIMAL_ID },
      update: {},
    });
  });

  it('is idempotent: a second follow keeps the original followedAt', async () => {
    const { service, upsert } = buildService();

    const first = await service.follow(ANIMAL_ID, claims);
    const second = await service.follow(ANIMAL_ID, claims);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(second).toEqual(first);
    expect(second.followedAt).toBe(FOLLOWED_AT.toISOString());
  });

  it('returns the resulting state with the animal follower count', async () => {
    const { service, count } = buildService();
    count.mockResolvedValue(7);

    await expect(service.follow(ANIMAL_ID, claims)).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT.toISOString(),
      followerCount: 7,
    });
    expect(count).toHaveBeenCalledWith({ where: { animalId: ANIMAL_ID } });
  });

  it('never takes a user id from the caller', async () => {
    const { service, upsert } = buildService();
    const otherClaims = {
      kind: InternalJwtKind.AUTHENTICATED,
      sub: 'user-2',
    } as unknown as AuthenticatedInternalJwt;

    await service.follow(ANIMAL_ID, otherClaims);

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: 'user-2', animalId: ANIMAL_ID },
      }),
    );
  });

  it('survives a concurrent duplicate: a unique violation re-reads the winning row', async () => {
    const { service, upsert, findUnique } = buildService();
    upsert.mockRejectedValue(uniqueViolation());
    findUnique.mockResolvedValue({ createdAt: FOLLOWED_AT });

    await expect(service.follow(ANIMAL_ID, claims)).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT.toISOString(),
      followerCount: 0,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { userId_animalId: { userId: USER_ID, animalId: ANIMAL_ID } },
      select: { createdAt: true },
    });
  });

  it('still fails when a unique violation leaves no row to re-read', async () => {
    const { service, upsert, findUnique } = buildService();
    upsert.mockRejectedValue(uniqueViolation());
    findUnique.mockResolvedValue(null);

    await expect(service.follow(ANIMAL_ID, claims)).rejects.toThrow(
      'Failed to follow animal',
    );
  });

  it('maps a recovery read that finds no row to a bad request', async () => {
    const { service, upsert, findUnique } = buildService();
    upsert.mockRejectedValue(uniqueViolation());
    findUnique.mockResolvedValue(null);

    await expect(service.follow(ANIMAL_ID, claims)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('maps a recovery read that throws to a bad request and logs it', async () => {
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { service, upsert, findUnique } = buildService();
    upsert.mockRejectedValue(uniqueViolation());
    findUnique.mockRejectedValue(new Error('connection reset'));

    await expect(service.follow(ANIMAL_ID, claims)).rejects.toThrow(
      BadRequestException,
    );
    expect(logged).toHaveBeenCalledWith(
      `Failed to re-read the existing follow: ${ANIMAL_ID}`,
      expect.anything(),
    );
    expect(logged).toHaveBeenCalledWith(
      `Failed to follow animal: ${ANIMAL_ID}`,
      expect.anything(),
    );

    logged.mockRestore();
  });

  it('does not swallow failures that are not unique violations', async () => {
    const { service, upsert, findUnique } = buildService();
    upsert.mockRejectedValue(new Error('socket hang up'));

    await expect(service.follow(ANIMAL_ID, claims)).rejects.toThrow(
      'Failed to follow animal',
    );
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe('AnimalFollowService.unfollow', () => {
  it('hard deletes the row scoped to the jwt subject', async () => {
    const { service, deleteMany } = buildService();

    await service.unfollow(ANIMAL_ID, claims);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, animalId: ANIMAL_ID },
    });
  });

  it('is a no-op success when the user is not following', async () => {
    const { service, deleteMany } = buildService();
    deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.unfollow(ANIMAL_ID, claims)).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    });
  });

  it('re-following after unfollowing returns a following status', async () => {
    const { service } = buildService();

    await service.unfollow(ANIMAL_ID, claims);

    await expect(service.follow(ANIMAL_ID, claims)).resolves.toMatchObject({
      isFollowing: true,
    });
  });
});

describe('AnimalFollowService.getStatus', () => {
  it('reports not following when no row exists', async () => {
    const { service, findUnique } = buildService();

    await expect(service.getStatus(ANIMAL_ID, claims)).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { userId_animalId: { userId: USER_ID, animalId: ANIMAL_ID } },
    });
  });

  it('reports not following for an anonymous caller without a user lookup', async () => {
    const { service, findUnique } = buildService();

    await expect(
      service.getStatus(ANIMAL_ID, anonymousClaims),
    ).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('reports not following when no claims are present at all', async () => {
    const { service, findUnique } = buildService();

    await expect(service.getStatus(ANIMAL_ID)).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: false,
      followedAt: null,
      followerCount: 0,
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('reports following with the followed timestamp and count when a row exists', async () => {
    const { service, findUnique, count } = buildService();
    findUnique.mockResolvedValue({
      id: 'follow-1',
      userId: USER_ID,
      animalId: ANIMAL_ID,
      createdAt: FOLLOWED_AT,
    });
    count.mockResolvedValue(5);

    await expect(service.getStatus(ANIMAL_ID, claims)).resolves.toEqual({
      animalId: ANIMAL_ID,
      isFollowing: true,
      followedAt: FOLLOWED_AT.toISOString(),
      followerCount: 5,
    });
  });
});

describe('AnimalFollowService error handling', () => {
  it('maps a follow failure to a bad request', async () => {
    const { service, upsert } = buildService();
    upsert.mockRejectedValue(new Error('write failed'));

    await expect(service.follow(ANIMAL_ID, claims)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('maps an unfollow failure to a bad request', async () => {
    const { service, deleteMany } = buildService();
    deleteMany.mockRejectedValue(new Error('delete failed'));

    await expect(service.unfollow(ANIMAL_ID, claims)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('maps a status read failure to a bad request', async () => {
    const { service, findUnique } = buildService();
    findUnique.mockRejectedValue(new Error('read failed'));

    await expect(service.getStatus(ANIMAL_ID, claims)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('maps a count failure during status read to a bad request', async () => {
    const { service, count } = buildService();
    count.mockRejectedValue(new Error('count failed'));

    await expect(service.getStatus(ANIMAL_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a non-integer follower count the shared contract forbids', async () => {
    const { service, count } = buildService();
    count.mockResolvedValue(1.5);

    await expect(service.getStatus(ANIMAL_ID)).rejects.toThrow(
      BadRequestException,
    );
  });
});
