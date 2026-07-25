import type { AnimalRescueStatus } from '@/types/AnimalType';

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
