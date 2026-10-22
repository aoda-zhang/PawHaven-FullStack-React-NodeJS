import { AnimalStatus } from '@pawhaven/shared/types';
import { describe, expect, it, vi } from 'vitest';

import { HomeService } from './home.service.js';

const VOLUNTEER_COUNT = 7;

type CountResult = number | Error;

const settle = <T>(value: T | Error) =>
  value instanceof Error ? Promise.reject(value) : Promise.resolve(value);

const buildService = (
  counts: {
    totalRescues?: CountResult;
    adoptedRescues?: CountResult;
    adoptedPets?: CountResult;
  },
  lists: { rescues?: unknown[] | Error; pets?: unknown[] | Error } = {},
  volunteerCount: CountResult = VOLUNTEER_COUNT,
) => {
  const { totalRescues = 0, adoptedRescues = 0, adoptedPets = 0 } = counts;

  const animalReportsCount = vi
    .fn()
    .mockImplementationOnce(() => settle(totalRescues))
    .mockImplementationOnce(() => settle(adoptedRescues));

  const adoptablePetCount = vi.fn(() => settle(adoptedPets));

  const prisma = {
    animalReports: { count: animalReportsCount },
    adoptablePet: { count: adoptablePetCount },
  };

  const rescueService = {
    findAll: vi.fn(() => settle(lists.rescues ?? [])),
  };
  const adoptionService = {
    findAll: vi.fn(() => settle(lists.pets ?? [])),
  };

  const httpClientService = {
    create: vi.fn().mockReturnValue({
      get: vi
        .fn()
        .mockImplementation(() =>
          volunteerCount instanceof Error
            ? Promise.reject(volunteerCount)
            : Promise.resolve({ data: { count: volunteerCount } }),
        ),
    }),
  };

  // Mirrors the real `featureFlag` block in src/config/*/env/index.json, which
  // declares both limits in every environment. `getOrThrow` reproduces Nest's
  // behaviour of failing fast when a required key is absent.
  const featureFlags: Record<string, number> = {
    'featureFlag.latestRescueLimit': 4,
    'featureFlag.adoptablePetLimit': 6,
  };

  const configService = {
    get: vi.fn((_key: string, defaultValue?: number) => defaultValue),
    getOrThrow: vi.fn((key: string) => {
      const value = featureFlags[key];

      if (value === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }

      return value;
    }),
  };

  const service = new HomeService(
    prisma as never,
    rescueService as never,
    adoptionService as never,
    httpClientService as never,
    configService as never,
  );

  return { service, animalReportsCount, adoptablePetCount, httpClientService };
};

describe('HomeService.getStats', () => {
  it('sums rescue and adoption totals into the hero stats', async () => {
    const { service } = buildService({
      totalRescues: 10,
      adoptedRescues: 3,
      adoptedPets: 2,
    });

    await expect(service.getStats()).resolves.toEqual({
      totalRescues: 10,
      totalAdopted: 5,
      totalVolunteers: VOLUNTEER_COUNT,
    });
  });

  it('reports the volunteer count even when there is no activity', async () => {
    const { service } = buildService({});

    await expect(service.getStats()).resolves.toEqual({
      totalRescues: 0,
      totalAdopted: 0,
      totalVolunteers: VOLUNTEER_COUNT,
    });
  });

  it('counts only rescues that are still present', async () => {
    const { service, animalReportsCount } = buildService({ totalRescues: 1 });

    await service.getStats();

    expect(animalReportsCount).toHaveBeenNthCalledWith(1, {
      where: { deletedAt: { isSet: false } },
    });
  });

  it('counts only rescues marked as adopted', async () => {
    const { service, animalReportsCount } = buildService({});

    await service.getStats();

    expect(animalReportsCount).toHaveBeenNthCalledWith(2, {
      where: {
        deletedAt: { isSet: false },
        animalStatus: AnimalStatus.ADOPTED,
      },
    });
  });

  it('reports a failed local data source instead of publishing zeroed stats', async () => {
    const { service } = buildService({
      totalRescues: new Error('mongo unavailable'),
    });

    await expect(service.getStats()).rejects.toThrow('mongo unavailable');
  });

  it('rejects when the auth volunteer-count call fails', async () => {
    const { service } = buildService(
      {},
      {},
      new Error('auth service unavailable'),
    );

    await expect(service.getStats()).rejects.toThrow(
      'auth service unavailable',
    );
  });
});

describe('HomeService.getHomeData', () => {
  it('assembles hero stats together with the latest rescues and pets', async () => {
    const { service } = buildService(
      { totalRescues: 2, adoptedRescues: 1, adoptedPets: 1 },
      { rescues: [{ id: 'PAW-0001' }], pets: [{ id: 'PET-0001' }] },
    );

    await expect(service.getHomeData()).resolves.toEqual({
      heroStats: {
        totalRescues: 2,
        totalAdopted: 2,
        totalVolunteers: VOLUNTEER_COUNT,
      },
      latestRescues: [{ id: 'PAW-0001' }],
      adoptablePets: [{ id: 'PET-0001' }],
    });
  });

  it('rejects when the stats section fails', async () => {
    const { service } = buildService({
      adoptedRescues: new Error('mongo unavailable'),
    });

    await expect(service.getHomeData()).rejects.toThrow('mongo unavailable');
  });

  it('rejects when the rescue section fails', async () => {
    const { service } = buildService(
      { totalRescues: 2, adoptedRescues: 1, adoptedPets: 1 },
      { rescues: new Error('mongo unavailable'), pets: [{ id: 'PET-0001' }] },
    );

    await expect(service.getHomeData()).rejects.toThrow('mongo unavailable');
  });

  it('rejects when the pets section fails', async () => {
    const { service } = buildService(
      { totalRescues: 2, adoptedRescues: 1, adoptedPets: 1 },
      { rescues: [{ id: 'PAW-0001' }], pets: new Error('mongo unavailable') },
    );

    await expect(service.getHomeData()).rejects.toThrow('mongo unavailable');
  });
});
