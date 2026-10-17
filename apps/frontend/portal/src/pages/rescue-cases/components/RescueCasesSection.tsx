import { AnimalStatusSchema } from '@pawhaven/shared/types';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RescueCase } from '../types';

import { CaseCard } from './CaseCard';
import { RescueCasesSectionSkeleton } from './RescueCasesSectionSkeleton';

interface RescueCasesSectionProps {
  cases: RescueCase[];
  onCaseClick: (id: string) => void;
  onSeeAll?: () => void;
  showStatusSummary?: boolean;
  isLoading?: boolean;
}

export const RescueCasesSection = ({
  cases,
  onCaseClick,
  onSeeAll,
  showStatusSummary = true,
  isLoading = false,
}: RescueCasesSectionProps) => {
  const { t } = useTranslation();

  const safeCases = cases ?? [];
  const pendingCount = safeCases.filter(
    (c) => c.status === AnimalStatusSchema.enum.pending,
  ).length;
  const inProgressCount = safeCases.filter(
    (c) => c.status === AnimalStatusSchema.enum.inProgress,
  ).length;

  const renderContent = () => {
    if (isLoading) {
      return <RescueCasesSectionSkeleton />;
    }
    if (safeCases.length === 0) {
      return (
        <p className="text-text-secondary py-16 text-center">
          {t('rescue_cases.no_cases_found')}
        </p>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {safeCases.map((caseData) => (
          <CaseCard
            key={caseData.id}
            caseData={caseData}
            onClick={onCaseClick}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="max-w-6xl py-10" aria-busy={isLoading}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-foreground font-serif text-2xl font-bold">
            {t('rescue_cases.section_title')}
          </h2>
          {showStatusSummary && (
            <p className="text-text-secondary mt-0.5 text-sm">
              {pendingCount}
              {t('common.rescue_status_pending')}
              {inProgressCount}
              {t('common.rescue_status_inProgress')}
            </p>
          )}
        </div>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-primary hover:text-primary/80 flex flex-shrink-0 cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
          >
            {t('rescue_cases.see_all')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {renderContent()}
    </section>
  );
};
