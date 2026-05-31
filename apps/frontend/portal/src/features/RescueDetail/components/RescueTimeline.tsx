import clsx from 'clsx';
import { Clock, CheckCircle, User } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RescueStatusType } from '@/features/Home/types';
import { getStatusColorByPrefix } from '@/utils/getStatusColorByPrefix';

export interface RescueUpdate {
  id: string;
  timestamp: string;
  status: RescueStatusType;
  content: string;
  operator: {
    name: string;
    avatar?: string;
  };
  images?: string[];
}

interface RescueTimelineProps {
  updates: RescueUpdate[];
}

export const RescueTimeline: React.FC<RescueTimelineProps> = ({ updates }) => {
  const { t } = useTranslation();
  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="bg-surface rounded-card shadow-card mt-6 w-full p-6">
      <h2 className="text-text mb-6 text-xl font-bold">
        {t('reportStray.rescue_timeline')}
      </h2>

      {sortedUpdates.length === 0 ? (
        <p className="text-text-muted py-8 text-center">
          {t('reportStray.no_updates_yet')}
        </p>
      ) : (
        <div className="relative pl-6">
          {sortedUpdates.map((update, index) => (
            <div key={update.id} className="relative mb-8">
              <div className="absolute top-3.5 -left-6 flex flex-col items-center">
                <div
                  className={clsx(
                    'z-base flex h-7 w-7 items-center justify-center rounded-full',
                    getStatusColorByPrefix({
                      status: update?.status,
                      prefix: 'text',
                    }),
                  )}
                >
                  <CheckCircle size={16} />
                </div>
                {index < sortedUpdates.length - 1 && (
                  <div className="bg-muted mt-1 h-full w-0.5" />
                )}
              </div>

              <div className="bg-muted rounded-card p-4">
                <div className="mb-3 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx([
                        'font-medium',
                        getStatusColorByPrefix({
                          status: update?.status,
                          prefix: 'text',
                        }),
                      ])}
                    >
                      {t(`common.rescue_status_${update.status}`)}
                    </span>
                  </div>

                  <div className="mt-2 flex gap-4 text-sm sm:mt-0">
                    <div className="text-text-muted flex items-center gap-1">
                      <Clock size={14} />
                      <span>{new Date(update.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-text-muted flex items-center gap-1">
                      <User size={14} />
                      <span>{update.operator.name}</span>
                    </div>
                  </div>
                </div>

                <p className="text-text mb-4">{update.content}</p>

                {update.images && update.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {update.images.map((img, i) => (
                      <img
                        key={img}
                        src={img}
                        alt={`Update ${i + 1}`}
                        className="rounded-card h-24 w-24 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
