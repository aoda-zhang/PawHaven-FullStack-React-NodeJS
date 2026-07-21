import { Button } from '@mui/material';
import { Home, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { ErrorInfo } from '../RouterErrorFallback';

const handleGoHome = () => {
  window.location.href = '/';
};

const retry = () => {
  window.location.reload();
};

interface SystemErrorProps {
  error?: Partial<ErrorInfo>;
  footer?: ReactNode;
}

export const SystemError = ({ footer }: SystemErrorProps) => {
  const { t } = useTranslation();

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          backgroundColor: 'white',
          display: 'block',
          width: '100%',
          padding: '60px 20px',
          textAlign: 'center',
          boxSizing: 'border-box',
          flex: '1',
        }}
      >
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              width: '112px',
              height: '112px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: '64px', height: '64px' }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <div
          style={{
            marginBottom: '48px',
            maxWidth: '560px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <h1
            style={{
              color: '#111827',
              fontSize: '36px',
              fontWeight: 700,
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {t('common.system_error', 'Oops Something went wrong')}
          </h1>
          <p
            style={{
              color: '#6b7280',
              fontSize: '18px',
              lineHeight: 1.6,
            }}
          >
            {t(
              'common.system_error_info',
              'An unexpected error occurred. Please try again or return to the homepage.',
            )}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            onClick={retry}
            startIcon={<RotateCw size={18} />}
            className="bg-primary text-text-inverse hover:bg-primary-active rounded-xl px-8 py-3 text-base font-semibold transition-all duration-300"
          >
            {t('common.retry', 'Try Again')}
          </Button>
          <Button
            variant="outlined"
            onClick={handleGoHome}
            startIcon={<Home size={18} />}
            className="border-warning text-warning hover:bg-warning/10 rounded-xl px-8 py-3 text-base font-semibold transition-all duration-300"
          >
            {t('common.go_to_home', 'Go Home')}
          </Button>
        </div>
      </div>

      {footer}
    </div>
  );
};
