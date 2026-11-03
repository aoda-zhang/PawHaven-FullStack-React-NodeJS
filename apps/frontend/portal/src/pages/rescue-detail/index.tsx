import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { rescueDetailQueryOptions } from './api/rescueDetail.queries';
import { RescueDetailContent } from './components/RescueDetailContent';

export const RescueDetail = () => {
  const { animalID = '' } = useParams<{ animalID: string }>();
  const { data: animal } = useSuspenseQuery(rescueDetailQueryOptions(animalID));

  return <RescueDetailContent animal={animal} />;
};
