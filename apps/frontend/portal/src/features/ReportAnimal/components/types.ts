export {
  ANIMAL_TYPES,
  SIZES,
  BEHAVIORS,
  type AnimalType,
  type Size,
  type Behavior,
} from '@pawhaven/shared/types';

export const URGENCY_ITEMS = [
  { key: 'bleeding' as const },
  { key: 'cantMove' as const },
  { key: 'dangerZone' as const },
  { key: 'breathing' as const },
] as const;

type UrgencyKey = (typeof URGENCY_ITEMS)[number]['key'];

export type UrgencyCheck = Record<UrgencyKey, boolean>;
