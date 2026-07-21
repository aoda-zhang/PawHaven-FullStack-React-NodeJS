import { cn } from '@pawhaven/frontend-core';
import { useTranslation } from 'react-i18next';

import type { RescueStatus } from '../types';

import { getStatusColorByPrefix } from '@/utils/getStatusColorByPrefix';

interface StatusBadgeProps {
  status: RescueStatus;
}

const STATUS_LABEL_KEYS: Record<RescueStatus, string> = {
  pending: 'common.rescue_status_pending',
  inProgress: 'common.rescue_status_inProgress',
  treated: 'common.rescue_status_treated',
  recovering: 'common.rescue_status_recovering',
  awaitingAdoption: 'common.rescue_status_awaitingAdoption',
  adopted: 'common.rescue_status_adopted',
  failed: 'common.rescue_status_failed',
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white',
        getStatusColorByPrefix({ status, prefix: 'bg' }),
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full text-white',
          getStatusColorByPrefix({ status, prefix: 'bg' }),
        )}
      />
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
};
