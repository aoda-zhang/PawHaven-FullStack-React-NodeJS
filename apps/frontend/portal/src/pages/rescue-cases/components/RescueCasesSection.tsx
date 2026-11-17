import { AnimalStatusSchema } from '@pawhaven/shared/types';
import type { RescueListItem } from '@pawhaven/shared/types';
import { Button } from '@pawhaven/ui';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CaseCard } from './CaseCard';
import { RescueCasesSectionSkeleton } from './RescueCasesSectionSkeleton';

interface RescueCasesSectionProps {
  cases: RescueListItem[];
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
  const needsHelpCount = safeCases.filter(
    (c) => c.status === AnimalStatusSchema.enum.needsHelp,
  ).length;
  const rescueInProgressCount = safeCases.filter(
    (c) => c.status === AnimalStatusSchema.enum.rescueInProgress,
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
          {showStatusSummary && !isLoading && (
            <p className="text-text-secondary mt-0.5 text-sm">
              {t('rescue_cases.status_summary', {
                needsHelpCount,
                rescueInProgressCount,
              })}
            </p>
          )}
        </div>
        {onSeeAll && (
          <Button type="button" variant="link" onClick={onSeeAll}>
            {t('rescue_cases.see_all')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {renderContent()}
    </section>
  );
};
