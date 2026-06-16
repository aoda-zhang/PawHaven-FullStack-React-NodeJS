import type { AnimalReportDto } from '@pawhaven/shared/types';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateReportStray } from './apis/queries';
import { ReportForm } from './components/ReportForm';

export const ReportStray: React.FC = () => {
  const { t } = useTranslation();
  const { mutate: createReport, isPending } = useCreateReportStray();

  const handleSubmit = (data: AnimalReportDto) => {
    createReport(data);
  };

  return (
    <div className="mx-auto w-full max-w-4xl overflow-x-hidden p-4 lg:p-10">
      <h2 className="text-primary mb-6 text-2xl font-bold lg:text-3xl">
        {t('reportStray.report_animal')}
      </h2>
      <ReportForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
};
