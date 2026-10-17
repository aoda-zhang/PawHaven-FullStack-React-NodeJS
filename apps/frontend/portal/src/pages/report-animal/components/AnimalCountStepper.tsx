import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { Minus, Plus } from 'lucide-react';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface AnimalCountStepperProps {
  label: string;
}

export const AnimalCountStepper = ({ label }: AnimalCountStepperProps) => {
  const { t } = useTranslation();
  const { field } = useController<ReportAnimalFormValues, 'animalCount'>({
    name: 'animalCount',
  });

  const count = field.value;
  const update = (next: number) => field.onChange(Math.max(1, next));

  return (
    <div>
      <label className="text-foreground mb-3 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t('reportAnimal.count_decrease')}
          onClick={() => update(count - 1)}
          className="border-border text-text-secondary hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-foreground w-10 text-center text-lg font-semibold">
          {count}
        </span>
        <button
          type="button"
          aria-label={t('reportAnimal.count_increase')}
          onClick={() => update(count + 1)}
          className="border-border text-text-secondary hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
