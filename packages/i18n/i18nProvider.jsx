import { I18nextProvider } from 'react-i18next';
import i18n from '.';
import { Suspense } from 'react';

function I18nLoadingFallback() {
  return (
    <div
      role="status"
      aria-label="Loading translations"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        opacity: 0.5,
        fontSize: '0.875rem',
        color: 'var(--color-text-muted, #737373)',
      }}
    >
      Loading...
    </div>
  );
}

export const I18nProvider = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<I18nLoadingFallback />}>{children}</Suspense>
    </I18nextProvider>
  );
};
