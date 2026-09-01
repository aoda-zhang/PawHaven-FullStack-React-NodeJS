import { cn } from '@pawhaven/frontend-core';
import { formatDateTime } from '@pawhaven/frontend-core/utils';
import type { RescueDetail } from '@pawhaven/shared/types';
import { Clock, PawPrint } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoTile } from './InfoTile';

interface AnimalBasicInfoProps {
  animal: RescueDetail;
  className?: string;
}

export const AnimalBasicInfo = ({
  animal,
  className,
}: AnimalBasicInfoProps) => {
  const { t, i18n } = useTranslation();

  const animalTypeLabel = t(`reportAnimal.${animal.animalType}`, {
    defaultValue: animal.animalType,
  });

  const infoItems: Array<{ label: string; value: ReactNode; show?: boolean }> =
    [
      {
        label: t('rescue_cases.info_animal'),
        value: (
          <span className="flex items-center gap-2">
            <PawPrint className="text-primary h-4 w-4" aria-hidden="true" />
            {animalTypeLabel}
          </span>
        ),
      },
      {
        label: t('rescueDetail.size'),
        value: t(`reportAnimal.size_${animal.size}`, {
          defaultValue: animal.size,
        }),
        show: !!animal.size,
      },
      {
        label: t('rescueDetail.animal_count'),
        value: `${animal.animalCount} ${t('reportAnimal.animal_count', {
          count: animal.animalCount,
        })}`,
        show: animal?.animalCount > 0,
      },
      {
        label: t('rescueDetail.coat_color'),
        value: animal.appearance?.color,
        show: !!animal.appearance?.color,
      },
      {
        label: t('rescueDetail.age'),
        value: t(`reportAnimal.${animal.age}`, { defaultValue: animal.age }),
        show: !!animal.age,
      },
      {
        label: t('reportAnimal.behavior_label'),
        value: animal.statusDescription,
        show: !!animal.statusDescription,
      },
      {
        label: t('rescueDetail.injury'),
        value: animal.appearance.hasInjury
          ? t('rescueDetail.yes')
          : t('rescueDetail.no'),
        show: !!animal?.appearance?.hasInjury,
      },
      {
        label: t('rescue_cases.info_reported'),
        value: (
          <span className="flex items-center gap-2">
            <Clock className="text-primary h-4 w-4" aria-hidden="true" />
            {formatDateTime(animal.reportedAt, i18n.language)}
          </span>
        ),
      },
    ];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="grid grid-cols-1 gap-x-1.5 gap-y-0 sm:grid-cols-2">
        {infoItems
          .filter((item) => item.show !== false)
          .map((item, index) => (
            <InfoTile key={index} label={item.label} value={item.value} />
          ))}
      </div>
    </div>
  );
};
