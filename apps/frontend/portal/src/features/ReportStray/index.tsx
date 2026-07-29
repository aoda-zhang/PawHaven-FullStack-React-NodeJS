import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReportWizard } from './components/ReportWizard';

export const ReportStray: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-foreground mb-1 text-2xl font-bold">
        {t('reportStray.wizard.title')}
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {t('reportStray.wizard.subtitle')}
      </p>
      <ReportWizard />
    </div>
  );
};
