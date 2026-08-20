import { SystemError, type ErrorInfo } from '@pawhaven/frontend-core';
import { I18nProvider } from '@pawhaven/i18n/i18nProvider';
import { type ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { QueryProvider } from './QueryProvider';
import { StoreProvider } from './StoreProvider';

import { RootLayoutFooter } from '@/layout/RootLayoutFooter';

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
      <I18nProvider>
        <StoreProvider>
          <QueryProvider>{children}</QueryProvider>
        </StoreProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};
