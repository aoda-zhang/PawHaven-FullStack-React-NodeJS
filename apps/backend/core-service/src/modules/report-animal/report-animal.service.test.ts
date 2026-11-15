import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { InternalJwtKind } from '@pawhaven/backend-core/types';

import { ReportAnimalService } from './reportAnimal.service.js';

const RECORD_ID = 'RPT-0001';
const PHOTO = 'report-animal/photo-123.png';

const dto = {
  animalType: 'cat',
  age: 'baby' as const,
  size: 'small',
  animalCount: 1,
  appearance: { color: 'black' },
  location: { address: 'Central Park' },
  status: 'friendly' as const,
  description: 'Found a stray kitten',
  reporterPhotos: [PHOTO, PHOTO],
  contactInfo: { email: 'reporter@example.com' },
};

const buildService = () => {
  const create = vi.fn(
    ({
      data,
    }: {
      select: { id: true };
      data: {
        reporter: { reporterID: string; reporterName: string | null } | null;
        reporterEmail: string | null;
        animalStatus: string;
      };
    }) => {
      void data;
      return Promise.resolve({ id: RECORD_ID });
    },
  );
  const service = new ReportAnimalService({
    animalReports: { create },
  } as never);
  return { service, create };
};

describe('ReportAnimalService.create', () => {
  it('persists the reporter username taken from the internal jwt', async () => {
    const { service, create } = buildService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: 'reporter-one',
    } as never);

    expect(create.mock.calls[0][0].select).toEqual({ id: true });
    expect(create.mock.calls[0][0].data).toMatchObject({
      reporter: { reporterID: 'user-1', reporterName: 'reporter-one' },
      reporterEmail: 'reporter@example.com',
      animalType: 'cat',
    });
  });

  it('normalises a whitespace-only username to null', async () => {
    const { service, create } = buildService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: '\t  \n',
    } as never);

    expect(create.mock.calls[0][0].data.reporter?.reporterName).toBeNull();
  });

  it('stores null when the jwt carries no username', async () => {
    const { service, create } = buildService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
    } as never);

    expect(create.mock.calls[0][0].data.reporter?.reporterName).toBeNull();
  });

  it('trims surrounding whitespace from a real username', async () => {
    const { service, create } = buildService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: ' reporter-one ',
    } as never);

    expect(create.mock.calls[0][0].data.reporter?.reporterName).toBe(
      'reporter-one',
    );
  });

  it('always stores a newly submitted report as pending', async () => {
    const { service, create } = buildService();

    await service.create(dto, {
      kind: 'authenticated',
      sub: 'user-1',
      username: 'reporter-one',
    } as never);

    expect(create.mock.calls[0][0].data.animalStatus).toBe('pending');
  });


  it('stores guest reports without fabricating a reporter identity', async () => {
    const { service, create } = buildService();

    await service.create(dto, { kind: InternalJwtKind.ANONYMOUS } as never);

    expect(create.mock.calls[0][0].data.reporter).toBeNull();
    expect(create.mock.calls[0][0].data.reporterEmail).toBe(
      'reporter@example.com',
    );
    expect(create.mock.calls[0][0].data.animalStatus).toBe('pending');
  });

  it('stores null when a guest omits the optional email', async () => {
    const { service, create } = buildService();

    await service.create(
      { ...dto, contactInfo: {} },
      { kind: InternalJwtKind.ANONYMOUS } as never,
    );

    expect(create.mock.calls[0][0].data.reporterEmail).toBeNull();
  });

  it('maps a create failure to a bad request', async () => {
    const service = new ReportAnimalService({
      animalReports: {
        create: vi.fn(() => Promise.reject(new Error('write failed'))),
      },
    } as never);

    await expect(
      service.create(dto, { kind: 'authenticated', sub: 'user-1' } as never),
    ).rejects.toThrow(BadRequestException);
  });
});
