import type { AnimalStatus } from '@pawhaven/shared/types';

export type StatusColorPrefix = 'text' | 'bg' | 'border';
export type RescueStatusType = AnimalStatus;

/**
 * The CSS token suffix of each rescue status. Token names are kebab-case;
 * the domain enum is camelCase.
 */
type RescueStatusSuffix =
  | 'pending-review'
  | 'needs-help'
  | 'rejected'
  | 'rescue-in-progress'
  | 'under-treatment'
  | 'recovering'
  | 'awaiting-adoption'
  | 'adopted'
  | 'deceased';

/** The Tailwind utility class a rescue status resolves to. */
export type RescueStatusColorClass =
  `${StatusColorPrefix}-rescue-status-${RescueStatusSuffix}`;

interface GetRescueStatusColorParams {
  status: RescueStatusType;
  prefix: StatusColorPrefix;
}

/* The class names are spelled out rather than built from a suffix map:
   Tailwind only generates a utility for a class it can see in the source. */
const bgStatusColors: Record<RescueStatusType, RescueStatusColorClass> = {
  pendingReview: 'bg-rescue-status-pending-review',
  needsHelp: 'bg-rescue-status-needs-help',
  rejected: 'bg-rescue-status-rejected',
  rescueInProgress: 'bg-rescue-status-rescue-in-progress',
  underTreatment: 'bg-rescue-status-under-treatment',
  recovering: 'bg-rescue-status-recovering',
  awaitingAdoption: 'bg-rescue-status-awaiting-adoption',
  adopted: 'bg-rescue-status-adopted',
  deceased: 'bg-rescue-status-deceased',
};

const textStatusColors: Record<RescueStatusType, RescueStatusColorClass> = {
  pendingReview: 'text-rescue-status-pending-review',
  needsHelp: 'text-rescue-status-needs-help',
  rejected: 'text-rescue-status-rejected',
  rescueInProgress: 'text-rescue-status-rescue-in-progress',
  underTreatment: 'text-rescue-status-under-treatment',
  recovering: 'text-rescue-status-recovering',
  awaitingAdoption: 'text-rescue-status-awaiting-adoption',
  adopted: 'text-rescue-status-adopted',
  deceased: 'text-rescue-status-deceased',
};

const borderStatusColors: Record<RescueStatusType, RescueStatusColorClass> = {
  pendingReview: 'border-rescue-status-pending-review',
  needsHelp: 'border-rescue-status-needs-help',
  rejected: 'border-rescue-status-rejected',
  rescueInProgress: 'border-rescue-status-rescue-in-progress',
  underTreatment: 'border-rescue-status-under-treatment',
  recovering: 'border-rescue-status-recovering',
  awaitingAdoption: 'border-rescue-status-awaiting-adoption',
  adopted: 'border-rescue-status-adopted',
  deceased: 'border-rescue-status-deceased',
};

/**
 * Returns the Tailwind CSS class that colours a rescue status with the
 * requested style prefix.
 *
 * @param params - The status colour parameters
 * @param params.status - The rescue status type
 * @param params.prefix - The CSS prefix type ('bg', 'text', or 'border')
 * @returns The Tailwind CSS class string for the rescue status
 * @throws Error if an unsupported prefix is provided
 */
export const getRescueStatusColor = ({
  status,
  prefix,
}: GetRescueStatusColorParams): RescueStatusColorClass => {
  switch (prefix) {
    case 'bg':
      return bgStatusColors[status];
    case 'text':
      return textStatusColors[status];
    case 'border':
      return borderStatusColors[status];
    default:
      throw new Error(`Unsupported prefix: ${prefix}`);
  }
};

/** Text foreground token class for readable rescue-status badges. */
export type RescueStatusForegroundClass =
  | 'text-rescue-status-pending-review-foreground'
  | 'text-rescue-status-needs-help-foreground'
  | 'text-rescue-status-rejected-foreground'
  | 'text-rescue-status-rescue-in-progress-foreground'
  | 'text-rescue-status-under-treatment-foreground'
  | 'text-rescue-status-recovering-foreground'
  | 'text-rescue-status-awaiting-adoption-foreground'
  | 'text-rescue-status-adopted-foreground'
  | 'text-rescue-status-deceased-foreground';

const statusForegroundColors: Record<
  RescueStatusType,
  RescueStatusForegroundClass
> = {
  pendingReview: 'text-rescue-status-pending-review-foreground',
  needsHelp: 'text-rescue-status-needs-help-foreground',
  rejected: 'text-rescue-status-rejected-foreground',
  rescueInProgress: 'text-rescue-status-rescue-in-progress-foreground',
  underTreatment: 'text-rescue-status-under-treatment-foreground',
  recovering: 'text-rescue-status-recovering-foreground',
  awaitingAdoption: 'text-rescue-status-awaiting-adoption-foreground',
  adopted: 'text-rescue-status-adopted-foreground',
  deceased: 'text-rescue-status-deceased-foreground',
};

export const getRescueStatusForegroundColor = ({
  status,
}: Pick<GetRescueStatusColorParams, 'status'>): RescueStatusForegroundClass =>
  statusForegroundColors[status];
