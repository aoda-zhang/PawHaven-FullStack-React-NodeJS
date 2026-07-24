import type { ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';

import { NotFound } from '../NotFound';
import { SystemError } from '../SystemError';

export interface ErrorInfo {
  status: number;
  statusText?: string;
  data?: string;
}

interface RouterErrorFallbackProps {
  isStableEnv: boolean;
  footer?: ReactNode;
}

const HTTP_NOT_FOUND = 404;

export const RouterErrorFallback = ({
  isStableEnv,
  footer,
}: RouterErrorFallbackProps) => {
  const errorInfo = useRouteError() as Partial<ErrorInfo>;

  if (errorInfo?.status === HTTP_NOT_FOUND) {
    return (
      <NotFound error={errorInfo} isStableEnv={isStableEnv} footer={footer} />
    );
  }

  return <SystemError error={errorInfo} footer={footer} />;
};
