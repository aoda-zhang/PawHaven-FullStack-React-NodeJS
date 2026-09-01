import { MultiImageUpload } from '@pawhaven/frontend-core';
import { REPORT_PHOTO_LIMITS } from '@pawhaven/shared/types';
import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const PhotoUpload = () => {
  const { t } = useTranslation();
  const { field, fieldState } = useController<ReportAnimalFormValues, 'photos'>(
    {
      name: 'photos',
    },
  );

  return (
    <MultiImageUpload
      value={field.value ?? []}
      onChange={field.onChange}
      error={fieldState.error?.message}
      required
      max={REPORT_PHOTO_LIMITS.max}
      maxSizeBytes={REPORT_PHOTO_LIMITS.maxSizeBytes}
      label={t('reportAnimal.photos_label')}
      hint={t('reportAnimal.photos_hint')}
    />
  );
};
