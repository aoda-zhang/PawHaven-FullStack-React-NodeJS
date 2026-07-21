import { cn } from '@pawhaven/frontend-core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FILTER_OPTIONS } from '../constants';
import type { FilterStatus, RescueCase } from '../types';

import { CaseCard } from './CaseCard';

interface RescueCasesSectionProps {
  cases: RescueCase[];
  onCaseClick: (id: string) => void;
}

export const RescueCasesSection = ({
  cases,
  onCaseClick,
}: RescueCasesSectionProps) => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const filteredCases = () => {
    if (activeFilter === 'all') return cases;
    return cases.filter((c) => c.status === activeFilter);
  };

  const displayedCases = filteredCases();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h2 className="text-foreground font-serif text-2xl font-bold">
          {t('rescue_cases.section_title')}
        </h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {displayedCases.filter((c) => c.status === 'pending').length}{' '}
          {t('common.rescue_status_pending')} ·{' '}
          {displayedCases.filter((c) => c.status === 'inProgress').length}{' '}
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

      {displayedCases.length === 0 ? (
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
