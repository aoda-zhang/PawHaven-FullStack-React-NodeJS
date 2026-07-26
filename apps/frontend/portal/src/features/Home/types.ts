import type { RescueStatus, RescueItem } from '@pawhaven/shared/types';

// Re-export shared types for backward compatibility
export type { RescueStatus as RescueStatusType, RescueItem as RescueItemType };

// UI-only helper types (not shared)
export type ColorPrefix = 'text' | 'bg' | 'border';
export type StatusColorType = `${ColorPrefix}-rescue-status-${RescueStatus}`;

export interface AdoptablePet {
  id: string;
  name: string;
  animalType: 'cat' | 'dog';
  age: string;
  sex: string;
  breed: string;
  location: string;
  waitingDays: number;
  tags: string[];
  photo: string;
  rescuedFrom: string;
  rescueDuration: string;
  medicalRecords: string[];
  temperament: string;
}
