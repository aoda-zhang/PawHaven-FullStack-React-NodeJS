import { formatDateTime } from '@pawhaven/frontend-core';
import type { RescueDetail } from '@pawhaven/shared/types';
import { Carousel, PhotoPlaceholder } from '@pawhaven/ui';
import { MapPin, PawPrint, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StatusBadge } from '@/features/RescueCases/components/StatusBadge';

interface AnimalBasicInfoProps {
  animal: RescueDetail;
}

const CASE_NUMBER_LENGTH = 6;

const UrgencyBadge = () => {
  const { t } = useTranslation();
  return (
    <span className="bg-status-high/10 text-status-high inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {t('rescue_cases.urgency_high')}
    </span>
  );
};

const InfoTile = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="bg-background-soft rounded-xl px-3 py-2.5">
    <p className="text-text-secondary mb-0.5 text-xs">{label}</p>
    <p className="text-foreground text-sm font-medium">{value}</p>
  </div>
);

export const AnimalBasicInfo = ({ animal }: AnimalBasicInfoProps) => {
  const { t, i18n } = useTranslation();

  const photos = animal.photos ?? [];
  const slides = photos.map((src) => ({ src, alt: animal.name }));
  const isUrgent = animal.appearance?.hasInjury === true;
  const caseNumber = animal.id.slice(-CASE_NUMBER_LENGTH).toUpperCase();

  const animalTypeLabel = t(`reportAnimal.${animal.animalType}`, {
    defaultValue: animal.animalType,
  });

  return (
    <section className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
      <div className="relative h-72 w-full">
        {slides.length > 0 ? (
          <Carousel
            images={slides}
            autoplay
            loop
            previousLabel={t('carousel.previous')}
            nextLabel={t('carousel.next')}
          />
        ) : (
          <PhotoPlaceholder iconClassName="h-14 w-14" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <StatusBadge status={animal.status} />
          {isUrgent && <UrgencyBadge />}
        </div>
        <div className="absolute bottom-5 left-5 text-white">
          <p className="mb-1 text-xs opacity-90">
            {t('rescueDetail.case_id', { id: caseNumber })}
          </p>
          <h1 className="font-serif text-3xl font-bold">{animal.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm opacity-90">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {animal.location?.address ?? t('rescueDetail.not_found')}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {animal.description && (
          <>
            <h2 className="text-foreground mb-1.5 font-serif text-base font-semibold">
              {t('rescue_cases.what_reported')}
            </h2>
            <p className="text-text-secondary mb-4 text-sm leading-relaxed">
              {animal.description}
            </p>
          </>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <InfoTile
            label={t('reportAnimal.animal_type')}
            value={
              <span className="flex items-center gap-2">
                <PawPrint className="text-primary h-4 w-4" aria-hidden="true" />
                {animalTypeLabel}
              </span>
            }
          />
          <InfoTile
            label={t('rescue_cases.info_reporter')}
            value={
              <span className="flex items-center gap-2">
                <User className="text-primary h-4 w-4" aria-hidden="true" />
                {animal.reporter?.name ?? t('common.anonymous')}
              </span>
            }
          />
          <InfoTile
            label={t('rescue_cases.info_reported')}
            value={formatDateTime(animal.reportedAt, i18n.language)}
          />
        </div>
      </div>
    </section>
  );
};
