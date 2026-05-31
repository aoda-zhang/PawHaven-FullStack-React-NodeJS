import dayjs from 'dayjs';
import { MapPin, Calendar, Info } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { AnimalDetail } from '@/types/AnimalType';

export const AnimalBasicInfo: React.FC<{ animal: AnimalDetail }> = ({
  animal,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD');
  };

  return (
    <div className="bg-surface rounded-card shadow-card w-full">
      <div className="p-6">
        <h1 className="text-primary mb-4 text-2xl font-bold">{animal?.name}</h1>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="text-text flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span>{animal?.location.address}</span>
          </div>

          <div className="text-text flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span>{formatDate(animal?.foundTime)}</span>
          </div>

          <div className="text-text flex items-center gap-2">
            <Info size={16} className="text-primary" />
            <span>{t(`reportStray.${animal?.animalType}`)}</span>
          </div>

          <div className="text-text flex items-center gap-2">
            <Info size={16} className="text-primary" />
            <span>{t(`reportStray.${animal?.age}`)}</span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-text mb-2 text-lg font-semibold">
            {t('reportStray.appearance')}
          </h3>
          <p className="text-text-secondary mb-4">
            {animal?.statusDescription}
          </p>

          {animal?.appearance.hasInjury && (
            <div className="bg-error-light border-border-error rounded-card text-error border p-3">
              <span className="text-error">{t('reportStray.has_injury')}</span>
              <p>{animal?.appearance.injuryDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
