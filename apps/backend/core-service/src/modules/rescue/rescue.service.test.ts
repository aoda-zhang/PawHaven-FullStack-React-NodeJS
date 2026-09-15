import { Logger, NotFoundException } from '@nestjs/common';
import { AnimalStatus } from '@pawhaven/shared/types';
import { describe, expect, it, vi } from 'vitest';

import { RescueService } from './rescue.service.js';

const RECORD_ID = 'PAW-0001';
const REPORTED_AT = new Date('2026-08-22T10:00:00.000Z');
const FIRST_PHOTO_URL = `/api/core/rescues/${RECORD_ID}/photo/0`;

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
  reporterId: 'user-1',
  createdAt: REPORTED_AT,
  deletedAt: null,
  ...overrides,
});

const buildService = (records: RecordOverrides[] | Error = []) => {
  const stored = records instanceof Error ? [] : records.map(buildRecord);

  const isPhotoLookup = (args?: { select?: Record<string, boolean> }) =>
    args?.select !== undefined && Object.keys(args.select).length === 1;

  const findMany = vi.fn((args?: { select?: Record<string, boolean> }) => {
    if (records instanceof Error) {
      return Promise.reject(records);
    }
    if (isPhotoLookup(args)) {
      return Promise.resolve(
        stored
          .filter((record) => record.reporterPhotos.length > 0)
          .map((record) => ({ id: record.id })),
      );
    }
    // Mirrors the projection: a list row never carries the photo payload, so a
    // mapper that still reads `reporterPhotos` gets undefined and fails loudly.
    return Promise.resolve(
      stored.map((record) => ({
        id: record.id,
        animalType: record.animalType,
        animalStatus: record.animalStatus,
        description: record.description,
        locationObj: record.locationObj,
        reporterId: record.reporterId,
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

  return { service: new RescueService(prisma as never), findMany, findUnique };
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

  it('never selects the multi-megabyte photo payload for a list row', async () => {
    const { service, findMany } = buildService([{}]);

    await service.findAll();

    const [listQuery] = findMany.mock.calls[0] as [
      { select: Record<string, boolean> },
    ];

    expect(listQuery.select).toBeDefined();
    expect(listQuery.select).not.toHaveProperty('reporterPhotos');
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

  it('links the first photo when the report has photos', async () => {
    const { service, findMany } = buildService([
      {
        reporterPhotos: [
          'data:image/png;base64,AAAA',
          'data:image/png;base64,BBBB',
        ],
      },
    ]);

    const [item] = await service.findAll();

    expect(item.image).toBe(FIRST_PHOTO_URL);
    expect(findMany.mock.calls[1]?.[0]).toMatchObject({
      where: { reporterPhotos: { isEmpty: false } },
      select: { id: true },
    });
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
});

describe('RescueService.findOne', () => {
  it('returns the detail contract for a live record', async () => {
    const { service } = buildService([
      {
        age: 'baby',
        reporterPhotos: [
          'data:image/png;base64,AAAA',
          'data:image/png;base64,BBBB',
        ],
      },
    ]);

    await expect(service.findOne(RECORD_ID)).resolves.toMatchObject({
      id: RECORD_ID,
      age: 'baby',
      status: AnimalStatus.PENDING,
      appearance: { color: 'black' },
      location: { address: 'Central Park' },
      photos: [FIRST_PHOTO_URL, `/api/core/rescues/${RECORD_ID}/photo/1`],
      reporter: { reporterId: 'user-1' },
      reportedAt: REPORTED_AT.toISOString(),
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

describe('RescueService.findPhoto', () => {
  it('decodes a stored data url into a mime type and buffer', async () => {
    const payload = Buffer.from('photo-bytes').toString('base64');
    const { service } = buildService([
      { reporterPhotos: [`data:image/png;base64,${payload}`] },
    ]);

    const photo = await service.findPhoto(RECORD_ID, 0);

    expect(photo.mimeType).toBe('image/png');
    expect(photo.buffer.toString()).toBe('photo-bytes');
  });

  it('rejects an index that holds a non data url value', async () => {
    const { service } = buildService([{ reporterPhotos: ['not-a-data-url'] }]);

    await expect(service.findPhoto(RECORD_ID, 0)).rejects.toThrow(
      new NotFoundException(`Photo not found: ${RECORD_ID}/0`).message,
    );
  });

  it('rejects a photo index that does not exist', async () => {
    const { service } = buildService([{}]);

    await expect(service.findPhoto(RECORD_ID, 3)).rejects.toThrow(
      `Photo not found: ${RECORD_ID}/3`,
    );
  });

  it('rejects a soft deleted record', async () => {
    const { service } = buildService([{ deletedAt: new Date() }]);

    await expect(service.findPhoto(RECORD_ID, 0)).rejects.toThrow(
      `Rescue not found: ${RECORD_ID}`,
    );
  });
});
