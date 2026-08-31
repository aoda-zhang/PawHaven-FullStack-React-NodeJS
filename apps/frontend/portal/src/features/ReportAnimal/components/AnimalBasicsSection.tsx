import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { FormInput, FormRadio } from '@pawhaven/ui';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AnimalCountStepper } from './AnimalCountStepper';
import { LocationSection } from './LocationSection';
import { PhotoUpload } from './PhotoUpload';
import { ANIMAL_TYPES, SIZES } from './types';

export const AnimalBasicsSection = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<ReportAnimalFormValues>();
  const animalType = useWatch({ control, name: 'animalType' });

  return (
    <div className="space-y-5">
      <LocationSection />

      <FormRadio
        name="animalType"
        label={t('reportAnimal.animal_type')}
        options={ANIMAL_TYPES.map((a) => ({
          value: a.value,
          label: t(`reportAnimal.${a.value}`),
        }))}
        required
      />

      {animalType === 'other' && (
        <FormInput
          name="otherAnimalType"
          label={t('reportAnimal.wizard.step2_other_label')}
          placeholder={t('reportAnimal.wizard.step2_other_placeholder')}
          required
        />
      )}

      <AnimalCountStepper label={t('reportAnimal.wizard.step2_count_label')} />

      <FormInput
        name="coatColor"
        label={t('reportAnimal.wizard.step3_color_label')}
        placeholder={t('reportAnimal.wizard.step3_color_placeholder')}
        required
      />

      <FormRadio
        name="size"
        label={t('reportAnimal.wizard.step3_size_label')}
        options={SIZES.map((s) => ({
          value: s.value,
          label: t(`reportAnimal.wizard.step3_size_${s.value}`),
        }))}
        required
      />

      <PhotoUpload />
    </div>
  );
};
