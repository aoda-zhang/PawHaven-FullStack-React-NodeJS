import { AlertTriangle } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';

import { ANIMAL_TYPES, type AnimalType, type Behavior } from './types';

interface StepConfirmProps {
  animalType: AnimalType;
  animalCount: number;
  behavior: Behavior | null;
  address: string;
  isUrgent: boolean;
  contactPhone: string;
  onContactPhoneChange: (phone: string) => void;
}

export const StepConfirm: React.FC<StepConfirmProps> = ({
  animalType,
  animalCount,
  behavior,
  address,
  isUrgent,
  contactPhone,
  onContactPhoneChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportStray.wizard.step6_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportStray.wizard.step6_subtitle')}
      </p>
      <div className="bg-muted mb-4 flex gap-3 rounded-xl p-4">
        <div className="bg-border flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg text-2xl">
          {ANIMAL_TYPES.find((a) => a.value === animalType)?.emoji}
        </div>
        <div>
          <div className="text-foreground text-sm font-semibold">
            {t(`reportStray.${animalType}`)}
            {address ? ` · ${address}` : ''}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {animalCount} {t('reportStray.wizard.step6_animal_count')}
            {animalCount !== 1 ? 's' : ''}
            {behavior
              ? ` · ${t(`reportStray.wizard.step4_behavior_${behavior}`)}`
              : ''}
          </div>
          <div className="mt-1.5">
            {isUrgent ? (
              <span className="bg-error-light text-error inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                {t('rescue_cases.urgency_high')}
              </span>
            ) : (
              <span className="text-muted-foreground bg-border rounded-full px-2 py-0.5 text-xs font-medium">
                {t('rescue_cases.urgency_normal')}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label className="text-foreground mb-1.5 block text-sm font-medium">
          {t('reportStray.wizard.step6_contact_label')}
        </label>
        <input
          type="text"
          value={contactPhone}
          onChange={(e) => onContactPhoneChange(e.target.value)}
          placeholder={t('reportStray.wizard.step6_contact_placeholder')}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
      <div className="bg-info-light border-info/30 rounded-xl p-3 text-xs leading-relaxed">
        <span className="text-foreground">
          {t('reportStray.wizard.step6_privacy')}
        </span>
      </div>
    </div>
  );
};
