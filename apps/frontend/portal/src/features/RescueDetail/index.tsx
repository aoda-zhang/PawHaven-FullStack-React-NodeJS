import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { useFetchRescueDetail } from './api/rescueDetail.queries';
import { AnimalBasicInfo } from './components/AnimalBasicInfo';
import { RelevantGuides } from './components/RelevantGuides';
import { RescueDetailSkeleton } from './components/RescueDetailSkeleton';
import { RescueTimeline } from './components/RescueTimeline';
import { VolunteerInfo } from './components/VolunteerInfo';

export const RescueDetail = () => {
  const { animalID = '' } = useParams<{ animalID: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: animal, isPending, isError } = useFetchRescueDetail(animalID);

  const handleBack = () => navigate(-1);
  if (animalID && isPending) return <RescueDetailSkeleton />;

  if (isError || !animal) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-text-secondary">{t('rescueDetail.not_found')}</p>
        <button
          type="button"
          onClick={handleBack}
          className="text-primary hover:text-primary-hover mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('rescue_cases.back_to_cases')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        type="button"
        onClick={handleBack}
        className="text-text-secondary hover:text-foreground mb-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('rescue_cases.back_to_cases')}
      </button>

      <div className="space-y-4">
        <AnimalBasicInfo animal={animal} />
        <RescueTimeline updates={[]} />
        <VolunteerInfo volunteer={undefined} />
        <RelevantGuides />
      </div>
    </div>
  );
};
