import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { rescueDetailQueryOptions } from './api/rescueDetail.queries';
import { RescueDetailContent } from './components/RescueDetailContent';
import { RescueDetailSkeleton } from './components/RescueDetailSkeleton';

export const RescueDetail = () => {
  const { animalID = '' } = useParams<{ animalID: string }>();
  const {
    data: animal,
    isPending,
    error,
  } = useQuery(rescueDetailQueryOptions(animalID));

  if (isPending) {
    return <RescueDetailSkeleton />;
  }

  if (animal === undefined) {
    throw error ?? new Error('Rescue detail unavailable');
  }

  return <RescueDetailContent animal={animal} />;
};
