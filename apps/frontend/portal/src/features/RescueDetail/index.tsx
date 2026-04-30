import { useParams } from 'react-router-dom';

import { useFetchAnimalDetail } from './apis/queries';
import { AnimalBasicInfo } from './components/AnimalBasicInfo';
import { RescueTimeline } from './components/RescueTimeline';
import type { RescueUpdate } from './types';

export const RescueDetail = () => {
  const { animalID } = useParams<{ animalID: string }>();
  const { data: animal } = useFetchAnimalDetail(animalID ?? '');
  const updates: RescueUpdate[] = [
    {
      id: 'update_001',
      timestamp: '2023-11-12T09:10:00Z',
      status: 'pending',
      content: 'User Ms. Chen reported finding a stray cat',
      operator: {
        id: 'user_102',
        name: 'Ms. Chen',
        avatar: 'https://pawhaven-mock.com/avatars/user102.jpg',
        role: 'reporter',
      },
    },
    {
      id: 'update_002',
      timestamp: '2023-11-12T11:30:00Z',
      status: 'inProgress',
      content: 'Volunteer Wang accepted the request and went to rescue',
      operator: {
        id: 'volunteer_05',
        name: 'Volunteer Wang',
        avatar: 'https://pawhaven-mock.com/avatars/vol05.jpg',
        role: 'rescuer',
      },
    },
    {
      id: 'update_003',
      timestamp: '2023-11-12T14:20:00Z',
      status: 'treated',
      content:
        'The cat was taken to the West City Rescue Center and received basic cleaning',
      operator: {
        id: 'volunteer_05',
        name: 'Volunteer Wang',
        avatar: 'https://pawhaven-mock.com/avatars/vol05.jpg',
        role: 'rescuer',
      },
      images: ['https://pawhaven-mock.com/updates/coal_shelter.jpg'],
    },
    {
      id: 'update_004',
      timestamp: '2023-11-13T10:15:00Z',
      status: 'recovering',
      content:
        'Health check completed, in good condition, basic vaccines administered',
      operator: {
        id: 'clinic_03',
        name: 'Love Pet Clinic',
        avatar: 'https://pawhaven-mock.com/avatars/clinic03.jpg',
        role: 'admin',
      },
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
      {animal && <AnimalBasicInfo animal={animal} />}

      <RescueTimeline updates={updates} />
    </div>
  );
};
