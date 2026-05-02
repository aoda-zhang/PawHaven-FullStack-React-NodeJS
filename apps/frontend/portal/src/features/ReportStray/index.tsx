import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReportForm } from './components/ReportForm';

export const ReportStray: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-primary">
        {t('reportStray.report_animal')}
      </h2>
      <ReportForm onSubmit={() => {}} isSubmitting={false} />
    </div>
  );
};
