import { formatDateTime } from '@pawhaven/frontend-core';
import type { RescueDetail as RescueDetailData } from '@pawhaven/shared/types';
import { Carousel } from '@pawhaven/ui';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { AnimalBasicInfo } from './AnimalBasicInfo';
import { RelevantGuides } from './RelevantGuides';
import { RescueTimeline } from './RescueTimeline';
import { VolunteerInfo } from './VolunteerInfo';

import { getStatusColorByPrefix } from '@/utils/getStatusColorByPrefix';

export const RescueDetailContent = ({
  animal,
}: {
  animal: RescueDetailData;
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleBack = () => navigate(-1);

  const animalTypeLabel = t(`reportAnimal.${animal.animalType}`, {
    defaultValue: animal.animalType,
  });

  const timelineUpdates = [
    {
      status: t('rescueDetail.timeline_reported'),
      time: formatDateTime(animal.reportedAt, i18n.language),
      description: animal.description ?? animal.statusDescription ?? '',
      author: animal.reporter.reporterName ?? t('common.anonymous'),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl py-6">
      <button
        type="button"
        onClick={handleBack}
        className="text-text-secondary hover:text-foreground mb-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('rescue_cases.back_to_cases')}
      </button>

      {animal.photos.length > 0 && (
        <div className="relative mb-4 h-48 overflow-hidden rounded-2xl sm:h-60">
          <Carousel
            images={animal.photos}
            autoplay
            loop
            previousLabel={t('rescueDetail.carousel_previous')}
            nextLabel={t('rescueDetail.carousel_next')}
            className="h-full w-full"
          />

          <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-row gap-1.5">
            <span className="text-foreground inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-xs shadow-sm">
              <span
                className={`h-1.5 w-1.5 rounded-full ${getStatusColorByPrefix({ status: animal.status, prefix: 'bg' }) ?? 'bg-slate-400'}`}
              />
              {t(`common.rescue_status_${animal.status}`)}
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-2xl font-bold text-white drop-shadow-sm">
              {animalTypeLabel}
            </p>
            {animal.location?.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-white/90">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {animal.location.address}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="bg-card border-border rounded-2xl border p-5 shadow-sm sm:p-6">
            <h2 className="text-foreground mb-5 font-serif text-lg font-semibold">
              {t('rescueDetail.basic_info')}
            </h2>
            {animal.description && (
              <p className="text-text-secondary mb-4 text-sm">
                {animal.description}
              </p>
            )}
            <AnimalBasicInfo animal={animal} />
          </section>
          <RescueTimeline updates={timelineUpdates} />
        </div>
        <div className="space-y-4">
          <VolunteerInfo animalId={animal.id} volunteer={undefined} />

          <RelevantGuides />
        </div>
      </div>
    </div>
  );
};
