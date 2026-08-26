import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ReportWizard } from './components/ReportWizard';

import { useCurrentUser } from '@/features/Auth/api/auth.queries';
import { routePaths } from '@/router/routePaths';

export const ReportAnimal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <p className="text-muted-foreground text-sm">
          {t('reportAnimal.wizard.loading')}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="text-foreground mb-1 text-2xl font-bold">
          {t('reportAnimal.wizard.title')}
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {t('reportAnimal.wizard.subtitle')}
        </p>
        <div className="bg-card border-borderxl border p-8 text-center shadow-xs">
          <h2 className="text-foreground mb-2 text-xl font-bold">
            {t('reportAnimal.wizard.sign_in_required_title')}
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            {t('reportAnimal.wizard.sign_in_required_desc')}
          </p>
          <button
            type="button"
            onClick={() => navigate(routePaths.login)}
            className="bg-primary text-primary-fg w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            {t('reportAnimal.wizard.sign_in_button')}
          </button>
        </div>
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
