import { useTranslation } from 'react-i18next';

import { ReportWizard } from './components/ReportWizard';

import { useCurrentUser } from '@/features/Auth/api/auth.queries';

export const ReportAnimal = () => {
  const { t } = useTranslation();
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-muted-foreground text-sm">
          {t('reportAnimal.wizard.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-foreground mb-1 text-2xl font-bold">
        {t('reportAnimal.wizard.title')}
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {t('reportAnimal.wizard.subtitle')}
      </p>
      <ReportWizard />
    </div>
  );
};
