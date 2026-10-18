import type { RescueListItem, AnimalStatus } from '@pawhaven/shared/types';

export type { AnimalStatus as RescueStatus };

export type RescueCase = RescueListItem;

export type FilterStatus = 'all' | AnimalStatus;
