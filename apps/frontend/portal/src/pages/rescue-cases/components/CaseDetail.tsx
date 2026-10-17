import { PhotoPlaceholder } from '@pawhaven/ui';
import { ArrowLeft, Clock, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RescueCase } from '../types';

import { RescueTimeline } from './RescueTimeline';
import { StatusBadge } from './StatusBadge';

interface CaseDetailProps {
  caseData: RescueCase | undefined;
  isLoading: boolean;
  isError: boolean;
  onBack: () => void;
}

const Skeleton = () => (
  <div className="mx-auto max-w-3xl px-4 py-12">
    <div className="animate-pulse space-y-6">
      <div className="bg-muted h-8 w-48 rounded" />
      <div className="bg-muted h-64 rounded-lg" />
      <div className="bg-muted h-6 w-3/4 rounded" />
      <div className="bg-muted h-4 w-1/2 rounded" />
    </div>
  </div>
);

const ErrorState = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-text-secondary">{t('rescue_cases.case_not_found')}</p>
      <button
        type="button"
        onClick={onBack}
        className="text-primary hover:text-primary-hover mt-4 inline-flex items-center gap-1 text-sm font-medium"
      >
        <ArrowLeft className="pointer" aria-hidden="true" />
        {t('rescue_cases.back_to_cases')}
      </button>
    </div>
  );
};

const BackButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-text-secondary hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm font-medium transition-colors"
    >
      <ArrowLeft className="pointer h-4 w-4" aria-hidden="true" />
      {t('rescue_cases.back_to_cases')}
    </button>
  );
};

const HeroSection = ({ caseData }: { caseData: RescueCase }) => (
  <div className="relative h-64 w-full">
    {caseData.image ? (
      <img
        src={caseData.image}
        alt={caseData.title}
        className="h-full w-full object-cover"
      />
    ) : (
      <PhotoPlaceholder iconClassName="h-12 w-12" />
    )}
    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
    <div className="absolute right-4 bottom-4 left-4 flex items-center gap-2">
      <StatusBadge status={caseData.status} />
    </div>
  </div>
);

const InfoGrid = ({ caseData }: { caseData: RescueCase }) => {
  const { t } = useTranslation();

  return (
    <div className="border-border mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-2">
      <div className="text-text-secondary flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span>{caseData.location}</span>
      </div>
      <div className="text-text-secondary flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>{caseData.reportedAt}</span>
      </div>
      <div className="text-text-secondary flex items-center gap-2 text-sm">
        <User className="h-4 w-4" aria-hidden="true" />
        <span>{caseData.reporterId}</span>
      </div>
      <div className="text-text-secondary flex items-center gap-2 text-sm">
        <span>{t('rescue_cases.info_distance')}</span>
        <span>
          {caseData.distance > 0
            ? `${caseData.distance} km`
            : t('common.unknown')}
        </span>
      </div>
    </div>
  );
};

const ActionButtons = () => {
  const { t } = useTranslation();

  return (
    <div className="border-border mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row">
      <button
        type="button"
        className="bg-primary text-primary-fg hover:bg-primary-hover flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        {t('rescue_cases.claim_rescue')}
      </button>
      <button
        type="button"
        className="border-border bg-card text-foreground hover:bg-muted flex-1 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        {t('rescue_cases.provide_transport')}
      </button>
    </div>
  );
};

const CaseContent = ({
  caseData,
  onBack,
}: {
  caseData: RescueCase;
  onBack: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BackButton onClick={onBack} />

      <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
        <HeroSection caseData={caseData} />

        <div className="p-6">
          <h1 className="text-foreground font-serif text-2xl font-bold">
            {caseData.title}
          </h1>
          <p className="text-text-secondary mt-2">{caseData.description}</p>

          <InfoGrid caseData={caseData} />

          <div className="border-border mt-8 border-t pt-6">
            <h2 className="text-foreground mb-4 font-serif text-lg font-semibold">
              {t('rescue_cases.what_reported')}
            </h2>
            <RescueTimeline currentStatus={caseData.status} />
          </div>

          <ActionButtons />
        </div>
      </div>
    </div>
  );
};

export const CaseDetail = ({
  caseData,
  isLoading,
  isError,
  onBack,
}: CaseDetailProps) => {
  if (isLoading) return <Skeleton />;

  if (isError || !caseData) return <ErrorState onBack={onBack} />;

  return <CaseContent caseData={caseData} onBack={onBack} />;
};
