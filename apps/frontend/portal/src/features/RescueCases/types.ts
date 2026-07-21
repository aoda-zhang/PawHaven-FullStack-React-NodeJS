import type { RescueStatus } from '@pawhaven/shared/types';

export type { RescueStatus };

export interface RescueCase {
  id: string;
  title: string;
  image: string;
  status: RescueStatus;
  urgency: 'high' | 'normal';
  animalType: string;
  location: string;
  description: string;
  reporter: string;
  reportedAt: string;
  distance: string;
}

export type FilterStatus = 'all' | RescueStatus;
