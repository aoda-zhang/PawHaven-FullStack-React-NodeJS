import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { ErrorInfo } from '../RouterErrorFallback';

import { useIsStableEnv } from '@/hooks/useIsStableEnv';

interface NotFundProps {
  error?: Partial<ErrorInfo>;
}

export const NotFund: React.FC<NotFundProps> = ({ error }) => {
  const { t } = useTranslation();
  const IsStableEnv = useIsStableEnv();

  const goToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col items-center gap-2 justify-center pt-8 text-lg;">
      <p className="text-error text-8xl lg:text-9xl">404</p>
      <p className="text-3xl">{t('common.not_found')}</p>
      <p>{t('common.not_found_info')}</p>
      {!IsStableEnv && <p>{error?.data}</p>}

      <Button
        type="button"
        variant="contained"
        onClick={goToHome}
        className="px-4 py-2 bg-primary rounded-lg hover:bg-primary transition-colors duration-300;"
      >
        {t('common.go_to_home')}
      </Button>
    </div>
  );
};
