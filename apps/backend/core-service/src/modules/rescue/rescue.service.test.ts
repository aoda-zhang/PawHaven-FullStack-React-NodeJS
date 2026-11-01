import { BadRequestException, Logger } from '@nestjs/common';
import { AnimalStatus } from '@pawhaven/shared/types';
import { Prisma } from '@prismaClient/index.js';
import { describe, expect, it, vi } from 'vitest';

import { RescueService } from './rescue.service.js';

const RECORD_ID = 'PAW-0001';
const REPORTED_AT = new Date('2026-08-22T10:00:00.000Z');
const FILE_BASE = 'https://assets.example.com';
const FIRST_PHOTO_KEY = 'report-animal/PAW-0001-photo-0.png';
const SECOND_PHOTO_KEY = 'report-animal/PAW-0001-photo-1.png';
const FIRST_PHOTO_URL = `${FILE_BASE}/${FIRST_PHOTO_KEY}`;
const SECOND_PHOTO_URL = `${FILE_BASE}/${SECOND_PHOTO_KEY}`;

type RecordOverrides = Record<string, unknown>;

const buildRecord = (overrides: RecordOverrides = {}) => ({
  id: RECORD_ID,
  animalType: 'cat',
  age: 'baby',
  animalStatus: AnimalStatus.PENDING,
  statusDescription: null,
  description: 'Found near the park',
  size: 'small',
  animalCount: 1,
  appearance: { color: 'black' },
  locationObj: { address: 'Central Park' },
  reporterPhotos: [],
  reporter: { reporterID: 'user-1', reporterName: null },
  createdAt: REPORTED_AT,
  deletedAt: null,
  ...overrides,
});

const buildService = (records: RecordOverrides[] | Error = []) => {
  const stored = records instanceof Error ? [] : records.map(buildRecord);

  const findMany = vi.fn((_args?: { select?: Record<string, boolean> }) => {
    if (records instanceof Error) {
      return Promise.reject(records);
    }
    return Promise.resolve(
      stored.map((record) => ({
        id: record.id,
        animalType: record.animalType,
        animalStatus: record.animalStatus,
        description: record.description,
        locationObj: record.locationObj,
        reporter: record.reporter,
        reporterPhotos: record.reporterPhotos,
        createdAt: record.createdAt,
      })),
    );
  });
  const findUnique = vi.fn(({ where }: { where: { id: string } }) =>
    records instanceof Error
      ? Promise.reject(records)
      : Promise.resolve(
          records.map(buildRecord).find((record) => record.id === where.id) ??
            null,
        ),
  );

  const prisma = {
    animalReports: { findMany, findUnique },
  };

  return {
    service: new RescueService(
      prisma as never,
      {
        getOrThrow: () => FILE_BASE,
      } as never,
    ),
    findMany,
    findUnique,
  };
};

describe('RescueService.findAll', () => {
  it('queries only live rescues, newest first', async () => {
    const { service, findMany } = buildService([{}]);

    await service.findAll();

    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: { isSet: false } },
      orderBy: { createdAt: 'desc' },
      take: undefined,
      select: expect.objectContaining({ id: true, createdAt: true }),
    });
  });

  it('projects reporterPhotos because photos are stored as URLs', async () => {
    const { service, findMany } = buildService([{}]);

    await service.findAll();

    const [listQuery] = findMany.mock.calls[0] as [
      { select: Record<string, boolean> },
    ];

    expect(listQuery.select).toMatchObject({ reporterPhotos: true });
  });

  it('maps a record into the list contract', async () => {
    const { service } = buildService([{}]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: RECORD_ID,
        title: 'cat',
        image: undefined,
        status: AnimalStatus.PENDING,
        animalType: 'cat',
        location: 'Central Park',
        description: 'Found near the park',
        reporterId: 'user-1',
        reportedAt: REPORTED_AT.toISOString(),
        distance: 0,
      },
    ]);
  });

  it('filters by animal status when one is requested', async () => {
    const { service, findMany } = buildService([]);

    await service.findAll(AnimalStatus.ADOPTED);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: { isSet: false },
        animalStatus: AnimalStatus.ADOPTED,
      },
      orderBy: { createdAt: 'desc' },
      take: undefined,
      select: expect.objectContaining({ id: true }),
    });
  });

  it('applies a positive integer limit', async () => {
    const { service, findMany } = buildService([]);

    await service.findAll(undefined, 4);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 4 }));
  });

  it.each([0, -1, 2.5, Number.NaN])('ignores a limit of %s', async (limit) => {
    const { service, findMany } = buildService([]);

    await service.findAll(undefined, limit);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: undefined }),
    );
  });

  it('falls back to "unknown" when the animal type is missing', async () => {
    const { service } = buildService([{ animalType: null }]);

    const [item] = await service.findAll();

    expect(item.title).toBe('unknown');
    expect(item.animalType).toBe('unknown');
  });

  it('falls back to pending when the stored status is not recognised', async () => {
    const { service } = buildService([{ animalStatus: 'archived' }]);

    const [item] = await service.findAll();

    expect(item.status).toBe(AnimalStatus.PENDING);
  });

  it('returns the first stored blob url as the list image', async () => {
    const { service } = buildService([
      { reporterPhotos: [FIRST_PHOTO_KEY, SECOND_PHOTO_KEY] },
    ]);

    const [item] = await service.findAll();

    expect(item.image).toBe(FIRST_PHOTO_URL);
  });

  it('skips a record whose stored location is not contract shaped', async () => {
    const { service } = buildService([
      {},
      { id: 'PAW-0002', locationObj: null },
    ]);

    const items = await service.findAll();

    expect(items.map((item) => item.id)).toEqual([RECORD_ID]);
  });

  it('warns about each skipped record so the data problem stays visible', async () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const { service } = buildService([{ locationObj: null }]);

    const items = await service.findAll();

    expect(items).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      `Skipping unmappable rescue: ${RECORD_ID}`,
      expect.anything(),
    );

    warn.mockRestore();
  });

  it('lets a data-store failure reach the unified error handler', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'mongo unavailable',
      {
        code: 'P2010',
        clientVersion: 'test',
      },
    );
    const { service } = buildService(error);

    await expect(service.findAll()).rejects.toBe(error);
  });

  it('lets an unexpected mapping failure reach the unified error handler', async () => {
    const { service } = buildService(new Error('unexpected'));

    await expect(service.findAll()).rejects.toThrow('unexpected');
  });
});

describe('RescueService.findOne', () => {
  it('returns the detail contract for a live record', async () => {
    const { service } = buildService([
      {
        age: 'baby',
        reporterPhotos: [FIRST_PHOTO_KEY, SECOND_PHOTO_KEY],
      },
    ]);

    await expect(service.findOne(RECORD_ID)).resolves.toMatchObject({
      id: RECORD_ID,
      age: 'baby',
      status: AnimalStatus.PENDING,
      appearance: { color: 'black' },
      location: { address: 'Central Park' },
      photos: [FIRST_PHOTO_URL, SECOND_PHOTO_URL],
      reporter: { reporterId: 'user-1', reporterName: null },
      reportedAt: REPORTED_AT.toISOString(),
    });
  });

  it('surfaces the stored reporter name on the detail contract', async () => {
    const { service } = buildService([
      { reporter: { reporterID: 'user-1', reporterName: 'reporter-one' } },
    ]);

    const detail = await service.findOne(RECORD_ID);

    expect(detail.reporter).toEqual({
      reporterId: 'user-1',
      reporterName: 'reporter-one',
    });
  });

  it('falls back to adult when the stored age is not recognised', async () => {
    const { service } = buildService([{ age: 'teenager' }]);

    const detail = await service.findOne(RECORD_ID);

    expect(detail.age).toBe('adult');
  });

  it('rejects an unknown id', async () => {
    const { service } = buildService([]);

    await expect(service.findOne('missing')).rejects.toThrow(
      'Rescue not found: missing',
    );
  });

  it('rejects a soft deleted record', async () => {
    const { service } = buildService([{ deletedAt: new Date() }]);

    await expect(service.findOne(RECORD_ID)).rejects.toThrow(
      `Rescue not found: ${RECORD_ID}`,
    );
  });

  it('reports a detail mapping failure as a bad request', async () => {
    const { service } = buildService([{ appearance: null }]);

    await expect(service.findOne(RECORD_ID)).rejects.toThrow(
      'Failed to fetch rescue',
    );
  });
});

describe('RescueService.create', () => {
  const dto = {
    animalType: 'cat',
    age: 'baby' as const,
    locationObj: { address: 'Central Park' },
    animalStatus: AnimalStatus.PENDING,
    description: 'Found a stray kitten',
    size: 'small',
    animalCount: 1,
    appearance: { color: 'black' },
    reporterPhotos: [],
  };

  const buildCreateService = () => {
    const create = vi.fn(
      ({
        data,
      }: {
        data: { reporter: { reporterID: string; reporterName: string | null } };
      }) => Promise.resolve({ id: RECORD_ID, ...data }),
    );
    const service = new RescueService(
      { animalReports: { create } } as never,
      { getOrThrow: () => FILE_BASE } as never,
    );
    return { service, create };
  };

  it('persists the reporter username from the internal jwt', async () => {
    const { service, create } = buildCreateService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: 'reporter-one',
    } as never);

    expect(create).toHaveBeenCalledWith({
      data: {
        ...dto,
        reporter: { reporterID: 'user-1', reporterName: 'reporter-one' },
      },
    });
  });

  it('normalises a whitespace-only username to null', async () => {
    const { service, create } = buildCreateService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: '   ',
    } as never);

    expect(create.mock.calls[0][0].data.reporter.reporterName).toBeNull();
  });

  it('stores null when the jwt carries no username', async () => {
    const { service, create } = buildCreateService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
    } as never);

    expect(create.mock.calls[0][0].data.reporter.reporterName).toBeNull();
  });

  it('trims surrounding whitespace from a real username', async () => {
    const { service, create } = buildCreateService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: '  reporter-one  ',
    } as never);

    expect(create.mock.calls[0][0].data.reporter.reporterName).toBe(
      'reporter-one',
    );
  });

  it('maps a create failure to a bad request', async () => {
    const service = new RescueService(
      {
        animalReports: {
          create: vi.fn(() => Promise.reject(new Error('write failed'))),
        },
      } as never,
      { getOrThrow: () => FILE_BASE } as never,
    );

    await expect(
      service.create(dto, { kind: 'authenticated', sub: 'user-1' } as never),
    ).rejects.toThrow(BadRequestException);
  });
});
