import { SystemError, type ErrorInfo } from '@pawhaven/frontend-core';
import { Button } from '@pawhaven/ui';
import type { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

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
          <Button
            type="button"
            variant="link"
            className="underline"
            onClick={resetErrorBoundary}
          >
            {t('common.retry')}
          </Button>
        </div>
      }
    />
  );
};
