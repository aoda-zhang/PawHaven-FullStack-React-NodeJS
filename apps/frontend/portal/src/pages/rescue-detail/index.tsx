import type { RescueDetail as RescueDetailData } from '@pawhaven/shared/types';
import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router-dom';

import { RescueDetailContent } from './components/RescueDetailContent';
import { RescueDetailSkeleton } from './components/RescueDetailSkeleton';

export const RescueDetail = () => {
  const { animal } = useLoaderData() as {
    animal: Promise<RescueDetailData>;
  };

  return (
    <Suspense fallback={<RescueDetailSkeleton />}>
      <Await resolve={animal}>
        {(resolvedAnimal) => <RescueDetailContent animal={resolvedAnimal} />}
      </Await>
    </Suspense>
  );
};
