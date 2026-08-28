import { PhoneInput } from '@pawhaven/ui';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ANIMAL_TYPES, type AnimalType, type Behavior } from './types';

interface StepConfirmProps {
  animalType: AnimalType;
  animalCount: number;
  behavior: Behavior | null;
  address: string;
  isUrgent: boolean;
  contactPhone: string;
  contactError: boolean;
  onContactPhoneChange: (phone: string) => void;
}

export const StepConfirm: React.FC<StepConfirmProps> = ({
  animalType,
  animalCount,
  behavior,
  address,
  isUrgent,
  contactPhone,
  contactError,
  onContactPhoneChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportAnimal.wizard.step5_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportAnimal.wizard.step5_subtitle')}
      </p>
      <div className="bg-muted mb-4 flex gap-3 rounded-xl p-4">
        <div className="bg-border flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg text-2xl">
          {ANIMAL_TYPES.find((a) => a.value === animalType)?.emoji}
        </div>
        <div>
          <div className="text-foreground text-sm font-semibold">
            {t(`reportAnimal.${animalType}`)}
            {address ? ` · ${address}` : ''}
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            {animalCount}{' '}
            {t('reportAnimal.wizard.step5_animal_count', {
              count: animalCount,
            })}
            {behavior
              ? ` · ${t(`reportAnimal.wizard.step3_behavior_${behavior}`)}`
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
          {t('reportAnimal.wizard.step5_contact_label')}
        </label>
        <PhoneInput
          phone={contactPhone}
          hasError={contactError}
          onPhoneChange={onContactPhoneChange}
        />
        {contactError && (
          <p className="text-error mt-1 text-xs">
            {t('reportAnimal.wizard.step5_contact_required')}
          </p>
        )}
      </div>
      <div className="bg-info-light border-info/30 rounded-xl p-3 text-xs leading-relaxed">
        <span className="text-foreground">
          {t('reportAnimal.wizard.step5_privacy')}
        </span>
      </div>
    </div>
  );
};
