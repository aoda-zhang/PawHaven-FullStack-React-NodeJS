import type { AdoptablePet, AnimalStatus } from '@pawhaven/shared/types';

export type { AdoptablePet };
export type { AnimalStatus as RescueStatusType };

export type ColorPrefix = 'text' | 'bg' | 'border';
export type StatusColorType = `${ColorPrefix}-rescue-status-${AnimalStatus}`;
