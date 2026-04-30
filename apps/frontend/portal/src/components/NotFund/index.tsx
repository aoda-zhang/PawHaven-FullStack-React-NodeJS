import Button from '@mui/material/Button';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ErrorInfo } from '../RouterErrorFallback';

import { RootLayoutFooter } from '@/layout/RootLayoutFooter';
import { useIsStableEnv } from '@/hooks/useIsStableEnv';

interface NotFundProps {
  error?: Partial<ErrorInfo>;
}

export const NotFund: React.FC<NotFundProps> = ({ error }) => {
  const { t } = useTranslation();
  const isStableEnv = useIsStableEnv();

  const goToHome = () => {
    window.location.href = '/';
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
        {/* Paw icon */}
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              width: '112px',
              height: '112px',
              borderRadius: '50%',
              backgroundColor: '#fffbeb',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: '64px', height: '64px' }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
        </div>

        {/* 404 number */}
        <div style={{ marginBottom: '32px' }}>
          <span
            style={{
              color: '#f59e0b',
              fontSize: '120px',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
            }}
          >
            404
          </span>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '48px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h2
            style={{
              color: '#111827',
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {t('common.not_found', 'Page Not Found')}
          </h2>
          <p
            style={{
              color: '#6b7280',
              fontSize: '18px',
              lineHeight: 1.6,
            }}
          >
            {t(
              'common.not_found_info',
              'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
            )}
          </p>
        </div>

        {/* Action */}
        <Button
          variant="contained"
          onClick={goToHome}
          startIcon={<Home size={18} />}
          className="!bg-[#f59e0b] !text-white !font-semibold !px-8 !py-3 !rounded-xl hover:!bg-[#d97706] !transition-all !duration-300 !text-base"
        >
          {t('common.go_to_home', 'Go to Home')}
        </Button>

        {/* Debug info in dev */}
        {!isStableEnv && error?.data && (
          <p
            style={{
              marginTop: '40px',
              color: '#9ca3af',
              fontSize: '12px',
              wordBreak: 'break-all',
              maxWidth: '560px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {String(error.data)}
          </p>
        )}
      </div>

      {/* Footer */}
      <RootLayoutFooter />
    </div>
  );
};