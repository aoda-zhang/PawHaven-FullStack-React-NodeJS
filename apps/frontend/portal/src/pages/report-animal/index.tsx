import type { AnimalReportDto } from '@pawhaven/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateReportAnimal } from './api/reportAnimal.mutations';
import { ReportAnimalForm } from './components/ReportAnimalForm';

export const ReportAnimal = () => {
  const { t } = useTranslation();
  const [submittedCaseId, setSubmittedCaseId] = useState('');
  const [submitErrorKey, setSubmitErrorKey] = useState<string | null>(null);
  const { mutate: createReport, isPending } = useCreateReportAnimal();

  const handleSubmit = (dto: AnimalReportDto) => {
    setSubmitErrorKey(null);
    createReport(dto, {
      onSuccess: (result) => {
        if (!result.id) {
          setSubmitErrorKey('reportAnimal.submit_failed');
          return;
        }
        setSubmittedCaseId(result.id);
        window.scrollTo(0, 0);
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-foreground mb-1 text-2xl font-bold">
        {t('reportAnimal.title')}
      </h1>
      <p className="text-text-secondary mb-6 text-sm">
        {t('reportAnimal.subtitle')}
      </p>
      <ReportAnimalForm
        onSubmit={handleSubmit}
        isPending={isPending}
        submittedCaseId={submittedCaseId}
        submitErrorKey={submitErrorKey}
      />
    </div>
  );
};
