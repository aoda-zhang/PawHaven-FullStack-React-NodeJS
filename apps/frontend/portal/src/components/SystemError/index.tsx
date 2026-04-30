import { Button } from '@mui/material';
import { Home, RotateCw } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { RootLayoutFooter } from '@/layout/RootLayoutFooter';

interface SystemErrorProps {
  error?: unknown;
}

export const SystemError: React.FC<SystemErrorProps> = () => {
  const { t } = useTranslation();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const retry = () => {
    window.location.reload();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main content */}
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
        {/* Warning icon */}
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

        {/* Error heading */}
        <div style={{ marginBottom: '48px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1
            style={{
              color: '#111827',
              fontSize: '36px',
              fontWeight: 700,
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {t('common.system_error', 'Oops! Something went wrong')}
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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={retry}
            startIcon={<RotateCw size={18} />}
            className="!bg-[#f59e0b] !text-white !font-semibold !px-8 !py-3 !rounded-xl hover:!bg-[#d97706] !transition-all !duration-300 !text-base"
          >
            {t('common.retry', 'Try Again')}
          </Button>
          <Button
            variant="outlined"
            onClick={handleGoHome}
            startIcon={<Home size={18} />}
            className="!border-[#f59e0b] !text-[#f59e0b] !font-semibold !px-8 !py-3 !rounded-xl hover:!bg-[#f59e0b]/10 !transition-all !duration-300 !text-base"
          >
            {t('common.go_to_home', 'Go Home')}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <RootLayoutFooter />
    </div>
  );
};