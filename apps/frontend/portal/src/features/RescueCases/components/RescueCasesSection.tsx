import { cn } from '@pawhaven/frontend-core';
import { RescueStatusSchema } from '@pawhaven/shared/types';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FilterStatus, RescueCase } from '../types';

import { CaseCard } from './CaseCard';

const FILTER_ALL: FilterStatus = 'all';

const FILTER_OPTIONS: Array<{ value: FilterStatus; labelKey: string }> = [
  { value: FILTER_ALL, labelKey: 'rescue_cases.filter_all' },
  {
    value: RescueStatusSchema.enum.pending,
    labelKey: 'common.rescue_status_pending',
  },
  {
    value: RescueStatusSchema.enum.inProgress,
    labelKey: 'common.rescue_status_inProgress',
  },
];

interface RescueCasesSectionProps {
  cases: RescueCase[];
  onCaseClick: (id: string) => void;
}

export const RescueCasesSection = ({
  cases,
  onCaseClick,
}: RescueCasesSectionProps) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(FILTER_ALL);

  const displayedCases = useMemo(() => {
    if (activeFilter === FILTER_ALL) return cases;
    return cases.filter((c) => c.status === activeFilter);
  }, [cases, activeFilter]);

  const pendingCount = useMemo(
    () =>
      displayedCases.filter((c) => c.status === RescueStatusSchema.enum.pending)
        .length,
    [displayedCases],
  );
  const inProgressCount = useMemo(
    () =>
      displayedCases.filter(
        (c) => c.status === RescueStatusSchema.enum.inProgress,
      ).length,
    [displayedCases],
  );

  return (
    <section className="max-w-6xl py-10">
      <div className="mb-6">
        <h2 className="text-foreground font-serif text-2xl font-bold">
          {t('rescue_cases.section_title')}
        </h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {pendingCount}
          {t('common.rescue_status_pending')}
          {inProgressCount}
          {t('common.rescue_status_inProgress')}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveFilter(option.value)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === option.value
                ? 'bg-primary text-primary-fg shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted border',
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      {displayedCases?.length === 0 ? (
        <p className="text-text-secondary py-16 text-center">
          {t('rescue_cases.no_cases_found')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {displayedCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              caseData={caseData}
              onClick={onCaseClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};
