import { useEffect, type ReactElement } from 'react';
import { useRouteError } from 'react-router-dom';

import { NotFound } from '../NotFound';
import { SystemError } from '../SystemError';

export interface ErrorInfo {
  status: number;
  statusText?: string;
  data?: string | ReactElement;
}

interface RouterErrorFallbackProps {
  isStableEnv: boolean;
  footer?: ReactElement;
}

export const RouterErrorFallback = ({
  isStableEnv,
  footer,
}: RouterErrorFallbackProps) => {
  const errorInfo = useRouteError() as Partial<ErrorInfo>;

  useEffect(() => {
    if (isStableEnv) {
      // report issues to Sentry
    }
    if (!isStableEnv) {
      console.error('current errorInfo:', JSON.stringify(errorInfo));
    }
  }, [errorInfo, isStableEnv]);

  switch (errorInfo?.status) {
    case 404:
      return (
        <NotFound error={errorInfo} isStableEnv={isStableEnv} footer={footer} />
      );
    case 500:
      return <SystemError error={errorInfo} footer={footer} />;
    default:
      return <SystemError error={errorInfo} footer={footer} />;
  }
};
