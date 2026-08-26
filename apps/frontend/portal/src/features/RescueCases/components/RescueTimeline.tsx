import { cn } from '@pawhaven/frontend-core';
import type { AnimalStatus } from '@pawhaven/shared/types';
import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimelineStep {
  status: AnimalStatus;
  labelKey: string;
  completed: boolean;
  active: boolean;
}

interface RescueTimelineProps {
  currentStatus: AnimalStatus;
}

const STATUS_ORDER: AnimalStatus[] = [
  'pending',
  'inProgress',
  'treated',
  'recovering',
  'awaitingAdoption',
  'adopted',
];

const STATUS_LABEL_KEYS: Record<AnimalStatus, string> = {
  pending: 'common.rescue_status_pending',
  inProgress: 'common.rescue_status_inProgress',
  treated: 'common.rescue_status_treated',
  recovering: 'common.rescue_status_recovering',
  awaitingAdoption: 'common.rescue_status_awaitingAdoption',
  adopted: 'common.rescue_status_adopted',
  failed: 'common.rescue_status_failed',
};

const renderStepIcon = (step: TimelineStep) => {
  if (step.completed) {
    return <CheckCircle2 className="text-success h-5 w-5" aria-hidden="true" />;
  }

  if (step.active) {
    return (
      <div className="border-primary bg-primary-light flex h-5 w-5 items-center justify-center rounded-full border-2">
        <div className="bg-primary h-2 w-2 rounded-full" />
      </div>
    );
  }

  return <Circle className="text-text-muted h-5 w-5" aria-hidden="true" />;
};

export const RescueTimeline = ({ currentStatus }: RescueTimelineProps) => {
  const { t } = useTranslation();

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const filteredStatuses =
    currentIdx === -1 ? STATUS_ORDER : STATUS_ORDER.slice(0, currentIdx + 1);

  const steps: TimelineStep[] = filteredStatuses.map((status, idx) => ({
    status,
    labelKey: STATUS_LABEL_KEYS[status],
    completed: idx < filteredStatuses.length - 1,
    active: idx === filteredStatuses.length - 1,
  }));

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={step.status} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            {renderStepIcon(step)}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'mt-1 h-6 w-0.5',
                  step.completed ? 'bg-success' : 'bg-border',
                )}
              />
            )}
          </div>
          <span
            className={cn(
              'text-sm',
              step.active
                ? 'text-foreground font-medium'
                : 'text-text-secondary',
            )}
          >
            {t(step.labelKey)}
          </span>
        </div>
      ))}
    </div>
  );
};
