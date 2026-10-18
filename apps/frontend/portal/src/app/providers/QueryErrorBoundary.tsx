import { SystemError, type ErrorInfo } from '@pawhaven/frontend-core';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { RootLayoutFooter } from '@/app/layout/RootLayoutFooter';

interface QueryErrorBoundaryProps {
  children: ReactNode;
}

export const QueryErrorBoundary = ({ children }: QueryErrorBoundaryProps) => {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error }: FallbackProps) => (
        <SystemError
          error={error as Partial<ErrorInfo> & { traceId?: string | null }}
          footer={<RootLayoutFooter />}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
