import { cn } from '@pawhaven/frontend-core';
import { Minus, Plus } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import { ANIMAL_TYPES, type AnimalType } from './types';

interface StepAnimalProps {
  animalType: AnimalType;
  animalCount: number;
  otherAnimalType: string;
  onAnimalTypeChange: (type: AnimalType) => void;
  onAnimalCountChange: (count: number) => void;
  onOtherAnimalTypeChange: (value: string) => void;
}

export const StepAnimal: React.FC<StepAnimalProps> = ({
  animalType,
  animalCount,
  otherAnimalType,
  onAnimalTypeChange,
  onAnimalCountChange,
  onOtherAnimalTypeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportStray.wizard.step2_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportStray.wizard.step2_subtitle')}
      </p>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {ANIMAL_TYPES.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => onAnimalTypeChange(a.value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
              animalType === a.value
                ? 'border-primary bg-accent text-primary'
                : 'border-border hover:border-primary/40 hover:bg-muted text-foreground',
            )}
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-sm font-medium">
              {t(`reportStray.${a.value}`)}
            </span>
          </button>
        ))}
      </div>
      {animalType === 'other' && (
        <div className="mb-5">
          <label
            htmlFor="other-animal-type"
            className="text-foreground mb-1.5 block text-sm font-medium"
          >
            {t('reportStray.wizard.step2_other_label')}
          </label>
          <input
            id="other-animal-type"
            type="text"
            value={otherAnimalType}
            onChange={(e) => onOtherAnimalTypeChange(e.target.value)}
            placeholder={t('reportStray.wizard.step2_other_placeholder')}
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary aors w-full rounded-lg border px-3 py-2 text-sm outline-none"
          />
        </div>
      )}
      <div>
        <label className="text-foreground mb-3 block text-sm font-medium">
          {t('reportStray.wizard.step2_count_label')}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAnimalCountChange(Math.max(1, animalCount - 1))}
            className="border-border text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-foreground w-10 text-center text-lg font-semibold">
            {animalCount}
          </span>
          <button
            type="button"
            onClick={() => onAnimalCountChange(animalCount + 1)}
            className="border-border text-muted-foreground hover:bg-muted flex h-9 w-9 items-center justify-center rounded-full border"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
