import { formatDateTime } from '@pawhaven/frontend-core';
import { MapPin, Calendar, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AnimalDetail } from '@/types/AnimalType';

export const AnimalBasicInfo = ({ animal }: { animal: AnimalDetail }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="bg-surface rounded-card shadow-card w-full">
      <div className="p-6">
        <h1 className="text-primary mb-4 text-2xl font-bold">{animal?.name}</h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animal?.location?.address && (
            <div className="text-text flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span>{animal.location.address}</span>
            </div>
          )}

          {animal?.foundTime && (
            <div className="text-text flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span>{formatDateTime(animal.foundTime, i18n.language)}</span>
            </div>
          )}

          {animal?.animalType && (
            <div className="text-text flex items-center gap-2">
              <Info size={16} className="text-primary" />
              <span>{t(`reportAnimal.${animal.animalType}`)}</span>
            </div>
          )}

          {animal?.age && (
            <div className="text-text flex items-center gap-2">
              <Info size={16} className="text-primary" />
              <span>{t(`reportAnimal.${animal.age}`)}</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-text mb-2 text-lg font-semibold">
            {t('reportAnimal.appearance')}
          </h3>
          {animal?.statusDescription && (
            <p className="text-text-secondary mb-4">
              {animal.statusDescription}
            </p>
          )}

          {animal?.appearance?.hasInjury && (
            <div className="bg-error-light border-border-error rounded-card text-error border p-3">
              <span className="text-error">{t('reportAnimal.has_injury')}</span>
              {animal.appearance.injuryDescription && (
                <p>{animal.appearance.injuryDescription}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
