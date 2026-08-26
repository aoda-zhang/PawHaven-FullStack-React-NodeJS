import { useParams } from 'react-router-dom';

import { useFetchRescueDetail } from './api/rescueDetail.queries';
import { AnimalBasicInfo } from './components/AnimalBasicInfo';
import { RescueTimeline } from './components/RescueTimeline';

export const RescueDetail = () => {
  const { animalID = '' } = useParams<{ animalID: string }>();
  const { data: animal } = useFetchRescueDetail(animalID);

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 md:py-6 lg:py-8">
      {animal && <AnimalBasicInfo animal={animal} />}

      {animal?.updates && <RescueTimeline updates={animal.updates} />}
    </div>
  );
};
