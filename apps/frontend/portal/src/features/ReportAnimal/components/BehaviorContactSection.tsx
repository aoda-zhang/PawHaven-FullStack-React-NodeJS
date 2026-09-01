import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import {
  FormCheckbox,
  FormPhoneInput,
  FormRadio,
  FormTextArea,
} from '@pawhaven/ui/form';
import { AlertTriangle } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BEHAVIORS } from './types';

export const BehaviorContactSection = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<ReportAnimalFormValues>();
  const urgent = useWatch({ control, name: 'urgent' });
  const isUrgent = !!urgent;

  return (
    <div className="space-y-5">
      <FormRadio
        name="behavior"
        label={t('reportAnimal.behavior_label')}
        options={BEHAVIORS.map((b) => ({
          value: b.value,
          label: t(`reportAnimal.behavior_${b.value}`),
        }))}
        required
      />

      <div className="bg-error-light border-error/20 flex items-start gap-2 rounded-xl border p-3 text-sm">
        <AlertTriangle className="text-error mt-0.5 h-4 w-4 flex-shrink-0" />
        <span className="text-foreground">
          {t('reportAnimal.emergency_note')}
        </span>
      </div>

      <FormTextArea
        name="description"
        label={t('reportAnimal.description_label')}
        placeholder={t('reportAnimal.description_placeholder')}
        required
        className="w-full"
      />

      <FormCheckbox name="urgent" label={t('reportAnimal.urgent_toggle')} />

      {isUrgent && (
        <div className="bg-primary-light border-primary/30 flex items-start gap-2 rounded-xl border p-3 text-sm">
          <AlertTriangle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="text-foreground">
            {t('reportAnimal.response_note')}
          </span>
        </div>
      )}

      <FormPhoneInput
        name="contactPhone"
        label={t('reportAnimal.contact_label')}
        required
      />

      <div className="bg-info-light border-info/30 rounded-xl p-3 text-xs leading-relaxed">
        <span className="text-foreground">{t('reportAnimal.privacy')}</span>
      </div>
    </div>
  );
};
