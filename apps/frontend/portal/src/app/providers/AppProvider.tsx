import { SystemError, type ErrorInfo } from '@pawhaven/frontend-core';
import { I18nProvider } from '@pawhaven/i18n/i18nProvider';
import { Loading } from '@pawhaven/ui';
import { type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { QueryErrorBoundary } from './QueryErrorBoundary';
import { QueryProvider } from './QueryProvider';
import { StoreProvider } from './StoreProvider';

import { BootstrapProvider } from '@/app/init/BootstrapProvider';
import { RootLayoutFooter } from '@/app/layout/RootLayoutFooter';

type AppProviderProps = {
  children: ReactNode;
};

const SystemErrorFallback = ({ error }: FallbackProps) => (
  <SystemError
    error={error as Partial<ErrorInfo>}
    footer={<RootLayoutFooter />}
  />
);

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ErrorBoundary FallbackComponent={SystemErrorFallback}>
      <I18nProvider loadingFallback={<Loading />}>
        <StoreProvider>
          <QueryProvider>
            <QueryErrorBoundary>
              <BootstrapProvider>{children}</BootstrapProvider>
            </QueryErrorBoundary>
          </QueryProvider>
        </StoreProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};
