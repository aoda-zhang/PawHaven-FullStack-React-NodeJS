import type { RescueStatus, RescueItem } from '@pawhaven/shared/types';

// Re-export shared types for backward compatibility
export type { RescueStatus as RescueStatusType, RescueItem as RescueItemType };

// UI-only helper types (not shared)
export type ColorPrefix = 'text' | 'bg' | 'border';
export type StatusColorType = `${ColorPrefix}-rescue-${RescueStatus}`;
