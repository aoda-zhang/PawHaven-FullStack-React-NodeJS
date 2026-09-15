import { AnimalStatus } from '@pawhaven/shared/types';
import { describe, expect, it, vi } from 'vitest';

import { HomeService } from './home.service.js';

const VOLUNTEER_BASELINE = 120;

type CountResult = number | Error;

const settle = (value: CountResult) =>
  value instanceof Error ? Promise.reject(value) : Promise.resolve(value);

const buildService = (
  counts: {
    totalRescues?: CountResult;
    adoptedRescues?: CountResult;
    adoptedPets?: CountResult;
  },
  lists: { rescues?: unknown[]; pets?: unknown[] } = {},
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
    findAll: vi.fn(() => Promise.resolve(lists.rescues ?? [])),
  };
  const adoptionService = {
    findAll: vi.fn(() => Promise.resolve(lists.pets ?? [])),
  };

  const service = new HomeService(
    prisma as never,
    rescueService as never,
    adoptionService as never,
  );

  return { service, animalReportsCount, adoptablePetCount };
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
      totalVolunteers: VOLUNTEER_BASELINE,
    });
  });

  it('reports the volunteer baseline even when there is no activity', async () => {
    const { service } = buildService({});

    await expect(service.getStats()).resolves.toEqual({
      totalRescues: 0,
      totalAdopted: 0,
      totalVolunteers: VOLUNTEER_BASELINE,
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

  it('reports a failed data source instead of publishing zeroed stats', async () => {
    const { service } = buildService({
      totalRescues: new Error('mongo unavailable'),
    });

    await expect(service.getStats()).rejects.toThrow(
      'Failed to compute hero stats',
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
        totalVolunteers: VOLUNTEER_BASELINE,
      },
      latestRescues: [{ id: 'PAW-0001' }],
      adoptablePets: [{ id: 'PET-0001' }],
    });
  });

  it('fails the page rather than rendering half-true stats', async () => {
    const { service } = buildService({
      adoptedRescues: new Error('mongo unavailable'),
    });

    await expect(service.getHomeData()).rejects.toThrow(
      'Failed to compute hero stats',
    );
  });
});
