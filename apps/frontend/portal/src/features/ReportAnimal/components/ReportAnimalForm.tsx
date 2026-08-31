import { zodResolver } from '@hookform/resolvers/zod';
import {
  createReportAnimalFormSchema,
  type AnimalReportDto,
  type ReportAnimalFormValues,
} from '@pawhaven/shared/types';
import { Button } from '@pawhaven/ui';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useCreateReportAnimal } from '../api/reportAnimal.mutations';
import { FALLBACK_ID_SUFFIX_LENGTH } from '../constants';
import { readFilesAsDataUrls } from '../utils/readFilesAsDataUrls';

import { AnimalBasicsSection } from './AnimalBasicsSection';
import { BehaviorContactSection } from './BehaviorContactSection';

export const ReportAnimalForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createReport, isPending } = useCreateReportAnimal();
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState('');

  const form = useForm<ReportAnimalFormValues>({
    resolver: zodResolver(
      createReportAnimalFormSchema({
        colorRequired: t('reportAnimal.wizard.step3_color_required'),
        addressRequired: t('reportAnimal.wizard.step1_address_required'),
        photosInvalid: t('reportAnimal.wizard.step1_photos_invalid'),
        photosFormat: t('reportAnimal.wizard.step1_photos_format'),
        photosSize: t('reportAnimal.wizard.step1_photos_size'),
        photosRequired: t('reportAnimal.wizard.step1_photos_required'),
        photosMax: t('reportAnimal.wizard.step1_photos_max'),
        otherRequired: t('reportAnimal.wizard.step2_other_required'),
        sizeRequired: t('reportAnimal.wizard.step3_size_required'),
        behaviorRequired: t('reportAnimal.wizard.step3_behavior_required'),
        contactRequired: t('reportAnimal.wizard.step2_contact_required'),
      }),
    ),
    mode: 'onBlur',
    defaultValues: {
      animalType: 'cat',
      animalCount: 1,
      otherAnimalType: '',
      coatColor: '',
      size: null,
      behavior: null,
      address: '',
      latitude: null,
      longitude: null,
      photos: [],
      urgencyChecks: {
        bleeding: false,
        cantMove: false,
        dangerZone: false,
        breathing: false,
      },
      contactPhone: '',
    },
  });

  const onSubmit = async (values: ReportAnimalFormValues) => {
    const isUrgent = Object.values(values.urgencyChecks).some(Boolean);
    const reporterPhotos = await readFilesAsDataUrls(values.photos);
    const dto: AnimalReportDto = {
      animalType: values.animalType,
      animalTypeOther:
        values.animalType === 'other' ? values.otherAnimalType : undefined,
      age: 'adult',
      appearance: {
        color: values.coatColor,
        hasInjury: values.urgencyChecks.bleeding,
        injuryDescription: values.urgencyChecks.bleeding
          ? t('reportAnimal.wizard.step4_urgency_bleeding')
          : '',
        otherFeatures: [
          values.size && t(`reportAnimal.wizard.step3_size_${values.size}`),
          values.animalType === 'other' && values.otherAnimalType,
          values.animalCount > 1 &&
            `${values.animalCount} ${t('reportAnimal.wizard.animal_count', {
              count: values.animalCount,
            })}`,
        ]
          .filter(Boolean)
          .join(', '),
      },
      location: {
        address: values.address,
        ...(values.latitude !== null && values.longitude !== null
          ? { latitude: values.latitude, longitude: values.longitude }
          : {}),
      },
      foundTime: new Date().toISOString(),
      status: isUrgent ? 'dangerous' : 'other',
      statusDescription: values.behavior
        ? t(`reportAnimal.wizard.step3_behavior_${values.behavior}`)
        : '',
      reporterPhotos,
      contactInfo: {
        name: 'Anonymous',
        phone: values.contactPhone.trim(),
        email: '',
      },
    };

    createReport(dto, {
      onSuccess: (data) => {
        setCaseId(
          data?.id ??
            `REP-${Date.now().toString().slice(-FALLBACK_ID_SUFFIX_LENGTH)}`,
        );
        setSubmitted(true);
        window.scrollTo(0, 0);
      },
    });
  };

  if (submitted) {
    return (
      <div className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
        <div className="bg-success-light mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <CheckCircle className="text-success h-8 w-8" />
        </div>
        <h1 className="text-foreground mb-2 text-2xl font-bold">
          {t('reportAnimal.wizard.success_title')}
        </h1>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('reportAnimal.wizard.case_number_prefix')}
          {caseId}
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          {t('reportAnimal.wizard.success_volunteers')}
        </p>
        <Button
          type="button"
          onClick={() => navigate('/')}
          className="w-full rounded-xl py-3"
        >
          {t('reportAnimal.wizard.success_home')}
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground mb-1 text-lg font-semibold">
            {t('reportAnimal.wizard.step1_title')}
          </h2>
          <p className="text-muted-foreground mb-5 text-sm">
            {t('reportAnimal.wizard.step1_subtitle')}
          </p>
          <AnimalBasicsSection />
        </div>

        <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground mb-1 text-lg font-semibold">
            {t('reportAnimal.wizard.step2_title')}
          </h2>
          <p className="text-muted-foreground mb-5 text-sm">
            {t('reportAnimal.wizard.step2_subtitle')}
          </p>
          <BehaviorContactSection />
        </div>

        <Button
          type="submit"
          loading={isPending}
          disabled={isPending}
          className="w-full rounded-xl py-3"
        >
          {isPending ? t('reportAnimal.submitting') : t('reportAnimal.submit')}
        </Button>
      </form>
    </FormProvider>
  );
};
