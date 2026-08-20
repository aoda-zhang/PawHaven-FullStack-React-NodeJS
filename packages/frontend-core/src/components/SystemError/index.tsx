import { Button } from '@pawhaven/ui';
import { Home, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils/cn';
import type { ErrorInfo } from '../RouterErrorFallback';

const handleGoHome = () => {
  window.location.href = '/';
};

const retry = () => {
  window.location.reload();
};

interface SystemErrorProps {
  error?: Partial<ErrorInfo>;
  footer?: ReactNode;
}

export const SystemError = ({ footer }: SystemErrorProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-background flex w-full flex-1 flex-col px-5 pt-10 pb-10 text-center">
        <div className="mb-10">
          <div className="bg-error-light text-error mx-auto inline-flex size-28 items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-16"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <div className="mx-auto mb-12 max-w-xl">
          <h1 className="text-text mb-4 text-4xl leading-tight font-bold">
            {t('common.system_error', 'Oops Something went wrong')}
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            {t(
              'common.system_error_info',
              'An unexpected error occurred. Please try again or return to the homepage.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={retry}
            className={cn('rounded-xl px-8 py-3 text-base font-semibold')}
          >
            <RotateCw size={18} />
            {t('common.retry', 'Try Again')}
          </Button>
          <Button
            variant="outline"
            onClick={handleGoHome}
            className={cn('rounded-xl px-8 py-3 text-base font-semibold')}
          >
            <Home size={18} />
            {t('common.go_to_home', 'Go Home')}
          </Button>
        </div>
      </div>

      {footer}
    </div>
  );
};
