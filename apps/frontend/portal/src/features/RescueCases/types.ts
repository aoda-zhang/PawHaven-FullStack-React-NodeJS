import type { RescueStatus } from '@pawhaven/shared/types';

import type { AnimalRescueStatus } from '@/types/AnimalType';

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

export interface RescueUpdate {
  id: string;
  timestamp: string;
  status: AnimalRescueStatus;
  operator: {
    id: string;
    name: string;
    avatar: string;
    role: 'reporter' | 'rescuer' | 'admin';
  };
  content: string;
  images?: string[];
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface RescueParticipantType {
  id: string;
  name: string;
  avatar?: string;
  role: 'reporter' | 'rescuer' | 'admin';
  joinedAt: string;
}
