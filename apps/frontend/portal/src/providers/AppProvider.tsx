import { I18nProvider } from '@pawhaven/i18n/i18nProvider';
import { type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { QueryProvider } from './QueryProvider';
import { StoreProvider } from './StoreProvider';

import { SystemError } from '@/components/SystemError';
import '@pawhaven/design-system/index.css';

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ErrorBoundary FallbackComponent={SystemError}>
      <I18nProvider>
        <StoreProvider>
          <QueryProvider>{children}</QueryProvider>
        </StoreProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};
