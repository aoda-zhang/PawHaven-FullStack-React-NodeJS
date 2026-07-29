export const ANIMAL_TYPES = [
  { value: 'cat' as const, emoji: '🐱' },
  { value: 'dog' as const, emoji: '🐕' },
  { value: 'other' as const, emoji: '🐾' },
] as const;

export type AnimalType = (typeof ANIMAL_TYPES)[number]['value'];

export const SIZES = [
  { value: 'small' as const },
  { value: 'medium' as const },
  { value: 'large' as const },
] as const;

export type Size = (typeof SIZES)[number]['value'];

export const BEHAVIORS = [
  { value: 'friendly' as const },
  { value: 'wary' as const },
  { value: 'aggressive' as const },
  { value: 'unknown' as const },
] as const;

export type Behavior = (typeof BEHAVIORS)[number]['value'];

export const URGENCY_ITEMS = [
  { key: 'bleeding' as const },
  { key: 'cantMove' as const },
  { key: 'dangerZone' as const },
  { key: 'breathing' as const },
] as const;

type UrgencyKey = (typeof URGENCY_ITEMS)[number]['key'];

export type UrgencyCheck = Record<UrgencyKey, boolean>;

export interface ReportDraft {
  animalType: AnimalType;
  animalCount: number;
  coatColor: string;
  size: Size | null;
  behavior: Behavior | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  urgencyChecks: UrgencyCheck;
  contactPhone: string;
}
