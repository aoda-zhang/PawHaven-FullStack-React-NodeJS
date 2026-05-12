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
    <div className="p-4 lg:p-10 max-w-4xl mx-auto">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-primary">
        {t('reportStray.report_animal')}
      </h2>
      <ReportForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
};
