import { z } from 'zod';

/**
 * Animal (rescue) status domain model, shared by frontend & backend.
 *
 * Naming note: `animalStatus` is the DB field (create DTOs map 1:1 to Prisma).
 * `status` is the API/display field exposed by list & detail responses.
 */
export const AnimalStatusValues = [
  'pending',
  'inProgress',
  'treated',
  'recovering',
  'awaitingAdoption',
  'adopted',
  'failed',
] as const;

export const AnimalStatusSchema = z.enum(AnimalStatusValues);

export type AnimalStatus = z.infer<typeof AnimalStatusSchema>;

export const AnimalStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  TREATED: 'treated',
  RECOVERING: 'recovering',
  AWAITING_ADOPTION: 'awaitingAdoption',
  ADOPTED: 'adopted',
  FAILED: 'failed',
} as const;
