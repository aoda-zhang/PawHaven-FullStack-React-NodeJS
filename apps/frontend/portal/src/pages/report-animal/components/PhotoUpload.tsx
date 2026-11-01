import { MultiImageUpload } from '@pawhaven/frontend-core';
import { REPORT_PHOTO_LIMITS } from '@pawhaven/shared/types';
import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface PhotoUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const PhotoUpload = ({ onFilesSelected }: PhotoUploadProps) => {
  const { t } = useTranslation();
  const { field, fieldState } = useController<ReportAnimalFormValues, 'photos'>(
    {
      name: 'photos',
    },
  );

  return (
    <MultiImageUpload
      value={field.value ?? []}
      onChange={(files) => {
        field.onChange(files);
        onFilesSelected(files);
      }}
      error={fieldState.error?.message}
      required
      max={REPORT_PHOTO_LIMITS.max}
      maxSizeBytes={REPORT_PHOTO_LIMITS.maxSizeBytes}
      acceptedTypes={REPORT_PHOTO_LIMITS.acceptedTypes}
      accept={REPORT_PHOTO_LIMITS.accept}
      label={t('reportAnimal.photos_label')}
      hint={t('reportAnimal.photos_hint')}
    />
  );
};
