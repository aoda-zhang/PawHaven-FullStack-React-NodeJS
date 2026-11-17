import { z } from 'zod';

/**
 * Animal (rescue) status domain model, shared by frontend & backend.
 *
 * Naming note: `animalStatus` is the DB field (create DTOs map 1:1 to Prisma).
 * `status` is the API/display field exposed by list & detail responses.
 */
export const AnimalStatusValues = [
  'pendingReview',
  'needsHelp',
  'rejected',
  'rescueInProgress',
  'underTreatment',
  'recovering',
  'awaitingAdoption',
  'adopted',
  'deceased',
] as const;

export const AnimalStatusSchema = z.enum(AnimalStatusValues);

export type AnimalStatus = z.infer<typeof AnimalStatusSchema>;

export const AnimalStatus = {
  PENDING_REVIEW: 'pendingReview',
  NEEDS_HELP: 'needsHelp',
  REJECTED: 'rejected',
  RESCUE_IN_PROGRESS: 'rescueInProgress',
  UNDER_TREATMENT: 'underTreatment',
  RECOVERING: 'recovering',
  AWAITING_ADOPTION: 'awaitingAdoption',
  ADOPTED: 'adopted',
  DECEASED: 'deceased',
} as const;

export const PublicAnimalStatusValues = [
  AnimalStatus.NEEDS_HELP,
  AnimalStatus.RESCUE_IN_PROGRESS,
  AnimalStatus.UNDER_TREATMENT,
  AnimalStatus.RECOVERING,
  AnimalStatus.AWAITING_ADOPTION,
  AnimalStatus.ADOPTED,
] as const;

export const isPublicAnimalStatus = (
  status: string | null | undefined,
): status is AnimalStatus =>
  typeof status === 'string' &&
  (PublicAnimalStatusValues as readonly string[]).includes(status);
