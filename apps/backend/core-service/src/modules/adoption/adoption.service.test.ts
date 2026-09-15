import { describe, expect, it, vi } from 'vitest';

import { AdoptionService } from './adoption.service';

const PET_ID = 'PET-0001';

type PetOverrides = Record<string, unknown>;

const buildPet = (overrides: PetOverrides = {}) => ({
  id: PET_ID,
  name: 'Milo',
  animalType: 'cat',
  age: '2 years',
  sex: 'male',
  breed: 'Tabby',
  location: 'Shelter A',
  waitingDays: 12,
  tags: ['calm'],
  photo: '/photo.jpg',
  rescuedFrom: 'Street',
  rescueDuration: '3 months',
  medicalRecords: ['vaccinated'],
  temperament: 'gentle',
  adoptionStatus: 'available',
  deletedAt: null,
  ...overrides,
});

const buildService = (pets: PetOverrides[] = []) => {
  const findMany = vi.fn(() => Promise.resolve(pets.map(buildPet)));
  const findUnique = vi.fn(({ where }: { where: { id: string } }) =>
    Promise.resolve(
      pets.map(buildPet).find((pet) => pet.id === where.id) ?? null,
    ),
  );

  const prisma = { adoptablePet: { findMany, findUnique } };

  return { service: new AdoptionService(prisma as never), findMany };
};

describe('AdoptionService.findAll', () => {
  it('queries only live pets, newest first', async () => {
    const { service, findMany } = buildService();

    await service.findAll();

    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: { isSet: false } },
      orderBy: { createdAt: 'desc' },
      take: undefined,
    });
  });

  it('maps a pet into the public contract', async () => {
    const { service } = buildService([{}]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({
        id: PET_ID,
        name: 'Milo',
        animalType: 'cat',
        adoptionStatus: 'available',
        waitingDays: 12,
        tags: ['calm'],
      }),
    ]);
  });

  it('filters by adoption status when one is requested', async () => {
    const { service, findMany } = buildService();

    await service.findAll('adopted');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: { isSet: false }, adoptionStatus: 'adopted' },
      }),
    );
  });

  it('applies a positive integer limit', async () => {
    const { service, findMany } = buildService();

    await service.findAll(undefined, 6);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 6 }));
  });

  it('defaults a missing adoption status to available', async () => {
    const { service } = buildService([{ adoptionStatus: undefined }]);

    const [pet] = await service.findAll();

    expect(pet.adoptionStatus).toBe('available');
  });

  it('lists a pet whose animal type is free text typed by the reporter', async () => {
    const { service } = buildService([{ animalType: 'rabbit' }]);

    const [pet] = await service.findAll();

    expect(pet.animalType).toBe('rabbit');
  });
});

describe('AdoptionService.findOne', () => {
  it('returns the contract for a live pet', async () => {
    const { service } = buildService([{}]);

    await expect(service.findOne(PET_ID)).resolves.toMatchObject({
      id: PET_ID,
      name: 'Milo',
    });
  });

  it('rejects an unknown id', async () => {
    const { service } = buildService();

    await expect(service.findOne('missing')).rejects.toThrow(
      'Adoptable pet not found: missing',
    );
  });

  it('rejects a soft deleted pet', async () => {
    const { service } = buildService([{ deletedAt: new Date() }]);

    await expect(service.findOne(PET_ID)).rejects.toThrow(
      `Adoptable pet not found: ${PET_ID}`,
    );
  });
});
