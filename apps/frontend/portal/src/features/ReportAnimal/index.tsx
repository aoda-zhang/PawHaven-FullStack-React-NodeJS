import { Loading } from '@pawhaven/ui';
import { useTranslation } from 'react-i18next';

import { ReportAnimalForm } from './components/ReportAnimalForm';

import { useCurrentUser } from '@/features/Auth/api/auth.queries';

export const ReportAnimal = () => {
  const { t } = useTranslation();
  const { isLoading } = useCurrentUser();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-foreground mb-1 text-2xl font-bold">
        {t('reportAnimal.title')}
      </h1>
      <p className="text-text-secondary mb-6 text-sm">
        {t('reportAnimal.subtitle')}
      </p>
      <ReportAnimalForm />
    </div>
  );
};
