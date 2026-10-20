import { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '.';

const I18nLoadingFallback = () => {
  return (
    <div role="status" aria-label="Loading translations">
      Loading...
    </div>
  );
};

export const I18nProvider = ({ children, loadingFallback }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={loadingFallback ?? <I18nLoadingFallback />}>
        {children}
      </Suspense>
    </I18nextProvider>
  );
};
