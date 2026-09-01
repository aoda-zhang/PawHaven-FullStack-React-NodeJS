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
        colorRequired: t('reportAnimal.color_required'),
        addressRequired: t('reportAnimal.address_required'),
        photosInvalid: t('reportAnimal.photos_invalid'),
        photosFormat: t('reportAnimal.photos_format'),
        photosSize: t('reportAnimal.photos_size'),
        photosRequired: t('reportAnimal.photos_required'),
        photosMax: t('reportAnimal.photos_max'),
        otherRequired: t('reportAnimal.other_required'),
        sizeRequired: t('reportAnimal.size_required'),
        ageRequired: t('reportAnimal.age_required'),
        behaviorRequired: t('reportAnimal.behavior_required'),
        contactRequired: t('reportAnimal.contact_required'),
        descriptionRequired: t('reportAnimal.description_required'),
        descriptionMax: t('reportAnimal.description_max'),
      }),
    ),
    mode: 'onBlur',
    defaultValues: {
      animalType: 'cat',
      animalCount: 1,
      otherAnimalType: '',
      coatColor: '',
      age: null,
      size: null,
      behavior: null,
      address: '',
      latitude: null,
      longitude: null,
      photos: [],
      urgent: false,
      contactPhone: '',
      description: '',
    },
  });

  const onSubmit = async (values: ReportAnimalFormValues) => {
    const description = values.description?.trim() ?? '';
    const isUrgent = values.urgent;
    const reporterPhotos = await readFilesAsDataUrls(values.photos);
    const dto: AnimalReportDto = {
      animalType:
        values.animalType === 'other'
          ? values.otherAnimalType
          : values.animalType,
      age: values.age!,
      size: values.size!,
      animalCount: values.animalCount,
      appearance: {
        color: values.coatColor,
        hasInjury: isUrgent && description.length > 0,
        injuryDescription: isUrgent ? description : '',
      },
      location: {
        address: values.address,
        ...(values.latitude !== null && values.longitude !== null
          ? { latitude: values.latitude, longitude: values.longitude }
          : {}),
      },
      status: isUrgent ? 'dangerous' : 'other',
      statusDescription: values.behavior
        ? t(`reportAnimal.behavior_${values.behavior}`)
        : '',
      reporterPhotos,
      description,
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
          {t('reportAnimal.success_title')}
        </h1>
        <p className="text-text-secondary mb-4 text-sm">
          {t('reportAnimal.case_number_prefix')}
          {caseId}
        </p>
        <p className="text-text-secondary mb-6 text-sm">
          {t('reportAnimal.success_volunteers')}
        </p>
        <Button
          type="button"
          onClick={() => navigate('/')}
          className="w-full rounded-xl py-3"
        >
          {t('reportAnimal.success_home')}
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground mb-1 text-lg font-semibold">
            {t('reportAnimal.basics_title')}
          </h2>
          <p className="text-text-secondary mb-5 text-sm">
            {t('reportAnimal.basics_subtitle')}
          </p>
          <AnimalBasicsSection />
        </div>

        <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
          <h2 className="text-foreground mb-1 text-lg font-semibold">
            {t('reportAnimal.behavior_title')}
          </h2>
          <p className="text-text-secondary mb-5 text-sm">
            {t('reportAnimal.behavior_subtitle')}
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
