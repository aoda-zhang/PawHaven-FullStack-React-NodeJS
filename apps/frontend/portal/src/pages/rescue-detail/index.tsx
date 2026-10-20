import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';

import { rescueDetailQueryOptions } from './api/rescueDetail.queries';
import { RescueDetailContent } from './components/RescueDetailContent';
import { RescueDetailSkeleton } from './components/RescueDetailSkeleton';

export const RescueDetail = () => {
  const { animalID = '' } = useParams<{ animalID: string }>();
  const { data: animal } = useSuspenseQuery(rescueDetailQueryOptions(animalID));

  return (
    <Suspense fallback={<RescueDetailSkeleton />}>
      <RescueDetailContent animal={animal} />
    </Suspense>
  );
};
