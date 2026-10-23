import type { AnimalStatus } from '@pawhaven/shared/types';

export type StatusColorPrefix = 'text' | 'bg' | 'border';
export type RescueStatusType = AnimalStatus;

/**
 * The CSS token suffix of each rescue status. Token names are kebab-case;
 * the domain enum is camelCase.
 */
type RescueStatusSuffix =
  | 'pending'
  | 'in-progress'
  | 'treated'
  | 'recovering'
  | 'awaiting-adoption'
  | 'adopted'
  | 'failed';

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
  pending: 'bg-rescue-status-pending',
  inProgress: 'bg-rescue-status-in-progress',
  treated: 'bg-rescue-status-treated',
  recovering: 'bg-rescue-status-recovering',
  awaitingAdoption: 'bg-rescue-status-awaiting-adoption',
  adopted: 'bg-rescue-status-adopted',
  failed: 'bg-rescue-status-failed',
};

const textStatusColors: Record<RescueStatusType, RescueStatusColorClass> = {
  pending: 'text-rescue-status-pending',
  inProgress: 'text-rescue-status-in-progress',
  treated: 'text-rescue-status-treated',
  recovering: 'text-rescue-status-recovering',
  awaitingAdoption: 'text-rescue-status-awaiting-adoption',
  adopted: 'text-rescue-status-adopted',
  failed: 'text-rescue-status-failed',
};

const borderStatusColors: Record<RescueStatusType, RescueStatusColorClass> = {
  pending: 'border-rescue-status-pending',
  inProgress: 'border-rescue-status-in-progress',
  treated: 'border-rescue-status-treated',
  recovering: 'border-rescue-status-recovering',
  awaitingAdoption: 'border-rescue-status-awaiting-adoption',
  adopted: 'border-rescue-status-adopted',
  failed: 'border-rescue-status-failed',
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
  `text-rescue-status-${RescueStatusSuffix}-foreground`;

const statusForegroundColors: Record<
  RescueStatusType,
  RescueStatusForegroundClass
> = {
  pending: 'text-rescue-status-pending-foreground',
  inProgress: 'text-rescue-status-in-progress-foreground',
  treated: 'text-rescue-status-treated-foreground',
  recovering: 'text-rescue-status-recovering-foreground',
  awaitingAdoption: 'text-rescue-status-awaiting-adoption-foreground',
  adopted: 'text-rescue-status-adopted-foreground',
  failed: 'text-rescue-status-failed-foreground',
};

export const getRescueStatusForegroundColor = ({
  status,
}: Pick<GetRescueStatusColorParams, 'status'>): RescueStatusForegroundClass =>
  statusForegroundColors[status];
