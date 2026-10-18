import type { AnimalReportDto } from '@pawhaven/shared/types';
import { Loading } from '@pawhaven/ui';
import { useTranslation } from 'react-i18next';

import { useCreateReportAnimal } from './api/reportAnimal.mutations';
import { ReportAnimalForm } from './components/ReportAnimalForm';

import { useCurrentUser } from '@/app/init/currentUser';

export const ReportAnimal = () => {
  const { t } = useTranslation();
  const { isLoading } = useCurrentUser();
  const { mutate: createReport, isPending } = useCreateReportAnimal();

  if (isLoading) {
    return <Loading />;
  }

  const handleSubmit = (dto: AnimalReportDto): Promise<{ id?: string }> => {
    return new Promise((resolve) => {
      createReport(dto, {
        onSuccess: (data) => resolve({ id: data?.id }),
      });
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
      <ReportAnimalForm onSubmit={handleSubmit} isPending={isPending} />
    </div>
  );
};
