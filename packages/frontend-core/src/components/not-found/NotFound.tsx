import { Button } from '@pawhaven/ui';
import { ArrowLeft, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils/cn';
import type { ErrorInfo } from '../router-error-fallback/RouterErrorFallback';

const goToHome = () => {
  window.location.href = '/';
};

const goBack = () => {
  window.history.back();
};

export interface NotFoundProps {
  error?: Partial<ErrorInfo>;
  isStableEnv?: boolean;
  footer?: ReactNode;
}

export const NotFound = ({
  error,
  isStableEnv = true,
  footer,
}: NotFoundProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-background flex w-full flex-1 flex-col px-5 pt-10 pb-10 text-center">
        <div className="mb-8">
          <div className="bg-warning-light text-warning mx-auto inline-flex size-28 items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-16"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
        </div>

        <div className="mb-8">
          <span className="text-warning text-9xl leading-none font-black tracking-tighter">
            404
          </span>
        </div>

        <div className="mx-auto mb-12 max-w-xl">
          <h2 className="text-text mb-4 text-3xl leading-tight font-bold">
            {t('common.not_found', "We can't find that page")}
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            {t(
              'common.not_found_info',
              'The link might be wrong, or the page may have been moved or removed. Check the address for typos, or start again from the homepage.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={goToHome}
            className={cn(
              'bg-warning text-text-inverse hover:bg-warning-hover rounded-xl px-8 py-3 text-base font-semibold',
            )}
          >
            <Home size={18} />
            {t('common.go_to_home', 'Go to Home')}
          </Button>
          <Button
            variant="outline"
            onClick={goBack}
            className={cn('rounded-xl px-8 py-3 text-base font-semibold')}
          >
            <ArrowLeft size={18} />
            {t('common.go_back', 'Go Back')}
          </Button>
        </div>

        {!isStableEnv && error?.data && (
          <p className="text-text-tertiary mx-auto mt-10 max-w-xl text-xs break-all">
            {String(error.data)}
          </p>
        )}
      </div>

      {footer}
    </div>
  );
};
