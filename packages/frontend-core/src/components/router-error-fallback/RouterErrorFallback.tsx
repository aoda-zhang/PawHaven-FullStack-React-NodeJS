import { HTTP_STATUS } from '@pawhaven/shared';
import type { ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';

import { NotFound } from '../not-found/NotFound';
import { SystemError } from '../system-error/SystemError';

export interface ErrorInfo {
  status: number;
  statusText?: string;
  data?: string;
}

interface RouterErrorFallbackProps {
  isStableEnv: boolean;
  footer?: ReactNode;
}

export const RouterErrorFallback = ({
  isStableEnv,
  footer,
}: RouterErrorFallbackProps) => {
  const errorInfo = useRouteError() as Partial<ErrorInfo>;

  if (errorInfo?.status === HTTP_STATUS.NOT_FOUND) {
    return (
      <NotFound error={errorInfo} isStableEnv={isStableEnv} footer={footer} />
    );
  }

  return <SystemError error={errorInfo} footer={footer} />;
};
