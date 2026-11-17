import type { AnimalStatus } from '@pawhaven/shared/types';
import { cn } from '@pawhaven/ui';
import { useTranslation } from 'react-i18next';

import {
  getRescueStatusColor,
  getRescueStatusForegroundColor,
} from '@/shared/utils/rescue-status/getRescueStatusColor';
import { getRescueStatusLabelKey } from '@/shared/utils/rescue-status/getRescueStatusLabelKey';

interface StatusBadgeProps {
  status: AnimalStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        getRescueStatusForegroundColor({ status }),
        getRescueStatusColor({ status, prefix: 'bg' }),
      )}
    >
      <span
        className={cn('inline-block h-1.5 w-1.5 rounded-full', 'bg-current')}
      />
      {t(getRescueStatusLabelKey(status))}
    </span>
  );
};
