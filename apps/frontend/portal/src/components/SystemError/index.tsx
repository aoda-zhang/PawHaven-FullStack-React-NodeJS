import { Button } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SystemErrorProps {
  error?: unknown;
}

export const SystemError: React.FC<SystemErrorProps> = () => {
  const { t } = useTranslation();

  const handleGoHome = () => {
    window.location.href = '/';
  };
  const retry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col justify-center items-center  p-10 min-w-lvw min-h-lvh">
      <p className="text-error text-9xl ">
        {t('common.system_error', { defaultValue: 'Something went wrong' })}
      </p>

      <p className="mb-6 text-2xl">
        {t('common.system_error_info', {
          defaultValue: 'An unexpected error occurred. Please try again later.',
        })}
      </p>

      <div className="flex gap-10">
        <Button variant="contained" onClick={retry}>
          {t('common.retry', { defaultValue: 'Try Again' })}
        </Button>
        <Button variant="outlined" onClick={handleGoHome}>
          {t('common.go_to_home', { defaultValue: 'Go Home' })}
        </Button>
      </div>
    </div>
  );
};
