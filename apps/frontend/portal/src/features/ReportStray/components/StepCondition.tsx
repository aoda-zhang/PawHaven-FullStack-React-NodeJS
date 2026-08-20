import { cn } from '@pawhaven/frontend-core';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import { BEHAVIORS, SIZES, type Behavior, type Size } from './types';

interface StepConditionProps {
  coatColor: string;
  size: Size | null;
  behavior: Behavior | null;
  onCoatColorChange: (color: string) => void;
  onSizeChange: (size: Size) => void;
  onBehaviorChange: (behavior: Behavior) => void;
}

export const StepCondition: React.FC<StepConditionProps> = ({
  coatColor,
  size,
  behavior,
  onCoatColorChange,
  onSizeChange,
  onBehaviorChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportStray.wizard.step3_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportStray.wizard.step3_subtitle')}
      </p>
      <div className="mb-4">
        <label className="text-foreground mb-2 block text-sm font-medium">
          {t('reportStray.wizard.step3_color_label')}
        </label>
        <input
          type="text"
          value={coatColor}
          onChange={(e) => onCoatColorChange(e.target.value)}
          placeholder={t('reportStray.wizard.step3_color_placeholder')}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label className="text-foreground mb-2 block text-sm font-medium">
          {t('reportStray.wizard.step3_size_label')}
        </label>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onSizeChange(s.value)}
              className={cn(
                'flex-1 rounded-xl border py-2 text-sm transition-colors',
                size === s.value
                  ? 'border-primary bg-accent text-primary font-medium'
                  : 'border-border text-foreground hover:border-primary/40 hover:bg-muted',
              )}
            >
              {t(`reportStray.wizard.step3_size_${s.value}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-foreground mb-2 block text-sm font-medium">
          {t('reportStray.wizard.step3_behavior_label')}
        </label>
        <div className="flex flex-col gap-2">
          {BEHAVIORS.map((b) => (
            <label
              key={b.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors',
                behavior === b.value
                  ? 'border-primary bg-accent'
                  : 'border-border hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name="behavior"
                checked={behavior === b.value}
                onChange={() => onBehaviorChange(b.value)}
                className="accent-primary"
              />
              <span className="text-foreground text-sm">
                {t(`reportStray.wizard.step3_behavior_${b.value}`)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
