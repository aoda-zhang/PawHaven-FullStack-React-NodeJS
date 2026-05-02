import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { reportStray } from './apis/requests';
import { ReportForm } from './components/ReportForm';
import type { AnimalReport } from './types';

export const ReportStray: React.FC = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AnimalReport) => {
    setIsSubmitting(true);
    try {
      await reportStray(data);
      toast.success(t('reportStray.submit_success'));
    } catch (error) {
      toast.error(t('reportStray.submit_error'));
      console.error('Report stray error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-4xl mx-auto">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-primary">
        {t('reportStray.report_animal')}
      </h2>
      <ReportForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};
