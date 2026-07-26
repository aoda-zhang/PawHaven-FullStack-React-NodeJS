import type { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import type { ErrorInfo } from '../RouterErrorFallback';
import { SystemError } from '../SystemError';

export const ContentFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
  const { t } = useTranslation();

  return (
    <SystemError
      error={error as Partial<ErrorInfo>}
      footer={
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="text-primary hover:text-primary-hover text-sm font-medium underline"
          >
            {t('common.retry')}
          </button>
        </div>
      }
    />
  );
};
