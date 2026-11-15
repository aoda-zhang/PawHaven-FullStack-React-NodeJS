import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { Button } from '@pawhaven/ui';
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
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t('reportAnimal.count_decrease')}
          onClick={() => update(count - 1)}
          className="rounded-full"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-foreground w-10 text-center text-lg font-semibold">
          {count}
        </span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={t('reportAnimal.count_increase')}
          onClick={() => update(count + 1)}
          className="rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
