import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { FormCheckbox, FormRadio } from '@pawhaven/ui';
import { AlertTriangle } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ContactPhoneField } from './ContactPhoneField';
import { BEHAVIORS, URGENCY_ITEMS } from './types';

export const BehaviorContactSection = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<ReportAnimalFormValues>();
  const urgencyChecks = useWatch({ control, name: 'urgencyChecks' });
  const isUrgent = Object.values(urgencyChecks).some(Boolean);

  return (
    <div className="space-y-5">
      <FormRadio
        name="behavior"
        label={t('reportAnimal.wizard.step3_behavior_label')}
        options={BEHAVIORS.map((b) => ({
          value: b.value,
          label: t(`reportAnimal.wizard.step3_behavior_${b.value}`),
        }))}
        required
      />

      <div className="bg-error-light border-error/20 flex items-start gap-2 rounded-xl border p-3 text-sm">
        <AlertTriangle className="text-error mt-0.5 h-4 w-4 flex-shrink-0" />
        <span className="text-foreground">
          {t('reportAnimal.wizard.step4_emergency_note')}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-foreground mb-1 block text-sm font-medium">
          {t('reportAnimal.wizard.step4_urgency_label')}
        </label>
        {URGENCY_ITEMS.map((u) => (
          <FormCheckbox
            key={u.key}
            name={`urgencyChecks.${u.key}`}
            label={t(`reportAnimal.wizard.step4_urgency_${u.key}`)}
          />
        ))}
      </div>

      {isUrgent && (
        <div className="bg-primary-light border-primary/30 flex items-start gap-2 rounded-xl border p-3 text-sm">
          <AlertTriangle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="text-foreground">
            {t('reportAnimal.wizard.step4_response_note')}
          </span>
        </div>
      )}

      <ContactPhoneField />

      <div className="bg-info-light border-info/30 rounded-xl p-3 text-xs leading-relaxed">
        <span className="text-foreground">
          {t('reportAnimal.wizard.step2_privacy')}
        </span>
      </div>
    </div>
  );
};
