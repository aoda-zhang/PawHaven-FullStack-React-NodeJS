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
    <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        {t('reportStray.rescue_timeline')}
      </h2>

      {sortedUpdates.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          {t('reportStray.no_updates_yet')}
        </p>
      ) : (
        <div className="relative pl-6">
          {sortedUpdates.map((update, index) => (
            <div key={update.id} className="mb-8 relative">
              <div className="absolute -left-6 top-3.5 flex flex-col items-center">
                <div
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center z-base',
                    getStatusColorByPrefix({
                      status: update?.status,
                      prefix: 'text',
                    }),
                  )}
                >
                  <CheckCircle size={16} />
                </div>
                {index < sortedUpdates.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
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

                  <div className="flex gap-4 mt-2 sm:mt-0 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={14} />
                      <span>{new Date(update.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <User size={14} />
                      <span>{update.operator.name}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{update.content}</p>

                {update.images && update.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {update.images.map((img, i) => (
                      <img
                        key={img}
                        src={img}
                        alt={`Update ${i + 1}`}
                        className="w-24 h-24 object-cover rounded-md"
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
