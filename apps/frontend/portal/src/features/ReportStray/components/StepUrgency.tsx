import { cn } from '@pawhaven/frontend-core';
import { AlertTriangle } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import { URGENCY_ITEMS, type UrgencyCheck } from './types';

interface StepUrgencyProps {
  urgencyChecks: UrgencyCheck;
  isUrgent: boolean;
  onUrgencyChange: (key: keyof UrgencyCheck, checked: boolean) => void;
}

export const StepUrgency: React.FC<StepUrgencyProps> = ({
  urgencyChecks,
  isUrgent,
  onUrgencyChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportStray.wizard.step5_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportStray.wizard.step5_subtitle')}
      </p>
      <div className="bg-error-light border-error/20 mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm">
        <AlertTriangle className="text-error mt-0.5 h-4 w-4 flex-shrink-0" />
        <span className="text-foreground">
          {t('reportStray.wizard.step5_emergency_note')}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {URGENCY_ITEMS.map((u) => (
          <label
            key={u.key}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors',
              urgencyChecks[u.key]
                ? 'border-error/40 bg-error-light'
                : 'border-border hover:bg-muted',
            )}
          >
            <input
              type="checkbox"
              checked={urgencyChecks[u.key]}
              onChange={(e) => onUrgencyChange(u.key, e.target.checked)}
              className="accent-error mt-0.5"
            />
            <span className="text-foreground text-sm">
              {t(`reportStray.wizard.step5_urgency_${u.key}`)}
            </span>
          </label>
        ))}
      </div>
      {isUrgent && (
        <div className="bg-primary-light border-primary/30 mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm">
          <AlertTriangle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="text-foreground">
            {t('reportStray.wizard.step5_response_note')}
          </span>
        </div>
      )}
    </div>
  );
};
