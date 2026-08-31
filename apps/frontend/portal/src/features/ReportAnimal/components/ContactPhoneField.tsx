import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { PhoneInput } from '@pawhaven/ui';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const ContactPhoneField = () => {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<ReportAnimalFormValues>();
  const contactPhoneError = formState.errors.contactPhone;

  return (
    <div>
      <label className="text-foreground mb-1.5 block text-sm font-medium">
        {t('reportAnimal.wizard.step2_contact_label')}
        <span className="text-error ml-0.5" aria-hidden="true">
          *
        </span>
      </label>
      <Controller
        name="contactPhone"
        control={control}
        render={({ field, fieldState }) => (
          <PhoneInput
            phone={field.value}
            hasError={Boolean(fieldState.error)}
            onPhoneChange={field.onChange}
          />
        )}
      />
      {contactPhoneError && (
        <p className="text-error mt-1 text-xs">{contactPhoneError.message}</p>
      )}
    </div>
  );
};
