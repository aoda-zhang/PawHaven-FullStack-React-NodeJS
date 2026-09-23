import { Loading } from '@pawhaven/ui';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export const SuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
};
