import { cn } from '@pawhaven/frontend-core';
import { RescueStatusSchema } from '@pawhaven/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useFetchRescueCases } from './api/rescueCases.queries';
import { RescueCasesSection } from './components/RescueCasesSection';
import type { FilterStatus } from './types';

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

const RescueCasesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: cases = [] } = useFetchRescueCases();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>(FILTER_ALL);

  const displayedCases =
    activeFilter === FILTER_ALL
      ? cases
      : cases.filter((c) => c.status === activeFilter);

  const handleCaseClick = (id: string) => {
    navigate(`/rescue/detail/${id}`);
  };

  return (
    <div className="max-w-6xl px-4">
      <div className="bb- flex gap-1 overflow-x-auto pt-100">
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
      <RescueCasesSection
        cases={displayedCases}
        onCaseClick={handleCaseClick}
      />
    </div>
  );
};

export { RescueCasesPage };
