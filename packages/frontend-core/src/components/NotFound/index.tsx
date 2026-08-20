import { Button } from '@pawhaven/ui';
import { Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../utils/cn';
import type { ErrorInfo } from '../RouterErrorFallback';

const goToHome = () => {
  window.location.href = '/';
};

interface NotFoundProps {
  error?: Partial<ErrorInfo>;
  isStableEnv: boolean;
  footer?: ReactNode;
}

export const NotFound = ({ error, isStableEnv, footer }: NotFoundProps) => {
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
            {t('common.not_found', 'Page Not Found')}
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            {t(
              'common.not_found_info',
              'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
            )}
          </p>
        </div>

        <Button
          onClick={goToHome}
          className={cn(
            'bg-warning text-text-inverse hover:bg-warning-hover mx-auto rounded-xl px-8 py-3 text-base font-semibold',
          )}
        >
          <Home size={18} />
          {t('common.go_to_home', 'Go to Home')}
        </Button>

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
