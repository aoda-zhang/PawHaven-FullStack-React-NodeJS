import '@pawhaven/design-tokens/globalTailwind.css';
import { I18nProvider } from '@pawhaven/i18n/i18nProvider';
import { type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MUIThemeProvider } from './MUIThemeProvider';
import { QueryProvider } from './QueryProvider';
import { StoreProvider } from './StoreProvider';

import { SystemError } from '@/components/SystemError';

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ErrorBoundary FallbackComponent={SystemError}>
      <I18nProvider>
        <MUIThemeProvider>
          <StoreProvider>
            <QueryProvider>{children}</QueryProvider>
          </StoreProvider>
        </MUIThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};
