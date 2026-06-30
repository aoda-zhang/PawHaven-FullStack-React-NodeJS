import { useEffect, type ReactElement } from 'react';
import { useRouteError } from 'react-router-dom';

import { NotFound } from '../NotFound';
import { SystemError } from '../SystemError';

import { useIsStableEnv } from '@/hooks/useIsStableEnv';

export interface ErrorInfo {
  status: number;
  statusText?: string;
  data?: string | ReactElement;
}

export const RouterErrorFallback = () => {
  const errorInfo = useRouteError() as Partial<ErrorInfo>;
  const IsStableEnv = useIsStableEnv();
  useEffect(() => {
    if (IsStableEnv) {
      // report issues to Sentry
    }
    if (!IsStableEnv) {
      console.error('current errorInfo:', JSON.stringify(errorInfo));
    }
  }, [errorInfo, IsStableEnv]);

  switch (errorInfo?.status) {
    case 404:
      return <NotFound error={errorInfo} />;
    case 500:
      return <SystemError error={errorInfo} />;
    default:
      return <SystemError error={errorInfo} />;
  }
};
