import { AnimalStatusSchema } from '@pawhaven/shared/types';
import { cn } from '@pawhaven/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { rescueCasesQueryOptions } from './api/rescueCases.queries';
import { RescueCasesSection } from './components/RescueCasesSection';
import type { FilterStatus } from './types';

import { routePaths } from '@/app/router/routePaths';

const FILTER_ALL: FilterStatus = 'all';

const FILTER_OPTIONS: Array<{ value: FilterStatus; labelKey: string }> = [
  { value: FILTER_ALL, labelKey: 'rescue_cases.filter_all' },
  {
    value: AnimalStatusSchema.enum.pending,
    labelKey: 'common.rescue_status_pending',
  },
  {
    value: AnimalStatusSchema.enum.inProgress,
    labelKey: 'common.rescue_status_inProgress',
  },
];

const RescueCasesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: cases } = useSuspenseQuery(rescueCasesQueryOptions());
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(FILTER_ALL);

  const displayedCases =
    activeFilter === FILTER_ALL
      ? cases
      : cases.filter((c) => c.status === activeFilter);

  const handleCaseClick = (id: string) => {
    navigate(
      routePaths.rescueCaseDetail.replace(':animalID', encodeURIComponent(id)),
    );
  };

  return (
    <div className="max-w-6xl px-4">
      <div className="flex gap-1 overflow-x-auto pt-10">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveFilter(option.value)}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeFilter === option.value
                ? 'bg-primary text-primary-fg shadow-sm'
                : 'bg-card border-border text-text-secondary hover:text-foreground hover:bg-muted border',
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
      <RescueCasesSection
        cases={displayedCases}
        onCaseClick={handleCaseClick}
      />
    </div>
  );
};

export { RescueCasesPage };
