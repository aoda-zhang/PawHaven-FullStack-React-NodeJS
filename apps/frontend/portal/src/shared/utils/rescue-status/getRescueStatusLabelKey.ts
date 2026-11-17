import type { AnimalStatus } from '@pawhaven/shared/types';

const STATUS_LABEL_KEYS: Record<AnimalStatus, string> = {
  pendingReview: 'common.rescue_status_pending_review',
  needsHelp: 'common.rescue_status_needs_help',
  rejected: 'common.rescue_status_rejected',
  rescueInProgress: 'common.rescue_status_rescue_in_progress',
  underTreatment: 'common.rescue_status_under_treatment',
  recovering: 'common.rescue_status_recovering',
  awaitingAdoption: 'common.rescue_status_awaiting_adoption',
  adopted: 'common.rescue_status_adopted',
  deceased: 'common.rescue_status_deceased',
};

export const getRescueStatusLabelKey = (status: AnimalStatus): string =>
  STATUS_LABEL_KEYS[status];
