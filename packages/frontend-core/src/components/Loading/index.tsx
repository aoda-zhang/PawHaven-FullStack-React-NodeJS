import { PawPrint } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Loading = () => {
  const { t } = useTranslation();

  return (
    <div
      className="bg-background/40 z-overlay fixed inset-0 flex items-center justify-center"
      role="status"
      aria-label={t('common.loading')}
    >
      <PawPrint
        aria-hidden="true"
        className="text-primary animate-paw-bounce size-8"
      />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
};
