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
    <div className="w-full bg-surface rounded-card shadow-card">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary mb-4">{animal?.name}</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-text">
            <MapPin size={16} className="text-primary" />
            <span>{animal?.location.address}</span>
          </div>

          <div className="flex items-center gap-2 text-text">
            <Calendar size={16} className="text-primary" />
            <span>{formatDate(animal?.foundTime)}</span>
          </div>

          <div className="flex items-center gap-2 text-text">
            <Info size={16} className="text-primary" />
            <span>{t(`reportStray.${animal?.animalType}`)}</span>
          </div>

          <div className="flex items-center gap-2 text-text">
            <Info size={16} className="text-primary" />
            <span>{t(`reportStray.${animal?.age}`)}</span>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-text">
            {t('reportStray.appearance')}
          </h3>
          <p className="text-text-secondary mb-4">
            {animal?.statusDescription}
          </p>

          {animal?.appearance.hasInjury && (
            <div className="p-3 bg-error-light border border-border-error rounded-card text-error">
              <span className="text-error">{t('reportStray.has_injury')}</span>
              <p>{animal?.appearance.injuryDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
