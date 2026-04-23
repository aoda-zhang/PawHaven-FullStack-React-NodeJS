import type { AnimalDetail, AnimalRescueStatus } from '@/types/AnimalType';
import { apiClient } from '@/utils/apiClient';

export const getAnimalDetail = (id: string) => {
  // return http.get(`/animal/${id}`);

  const animal: AnimalDetail = {
    id: 'animal_007',
    name: 'Coal',
    animalType: 'cat',
    age: 'young',
    appearance: {
      color: 'Black',
      hasInjury: false,
      otherFeatures: 'Green eyes, short hair, fluffy tail',
      injuryDescription: '',
    },
    location: {
      address: 'No. 88 Jianguo Road, Chaoyang District, Beijing',
      latitude: 39.908823,
      longitude: 116.39747,
    },
    foundTime: '2023-11-12T08:45:00Z',
    status: 'pending',
    statusDescription:
      'Found sunbathing downstairs of the office building, very friendly, already had a preliminary health check',
    reporterPhotos: [
      'https://daoinsights.com/wp-content/webp-express/webp-images/uploads/2022/03/anoir-chafik-2_3c4dIFYFU-unsplash-1870x1169.jpg.webp',
      'https://media.4-paws.org/1/b/1/4/1b14c5ffc386210e11c20c5dd139b772af045503/VIER%20PFOTEN_2023-10-19_00181-3801x2534-3662x2534-1920x1329.jpg',
    ],
    reporter: {
      id: 'user_102',
      name: 'Ms. Chen',
      contactInfo: {
        phone: '13576543210',
        email: 'chen@example.com',
      },
    },

    updates: [
      {
        id: 'update_001',
        timestamp: '2023-11-12T09:10:00Z',
        content: 'User Ms. Chen reported finding a stray cat',
        status: 'pending',
        operator: {
          id: 'user_102',
          name: 'Ms. Chen',
          avatar: 'https://pawhaven-mock.com/avatars/user102.jpg',
          role: 'reporter',
        },
      },
    ],
    interactions: {
      comments: [
        {
          id: 'comment_001',
          userId: 'user_201',
          userName: 'Student Li',
          avatar: 'https://pawhaven-mock.com/avatars/user201.jpg',
          content:
            'I’ve seen this cat! It was also in the nearby park last week',
          timestamp: '2023-11-12T10:05:00Z',
          likes: 3,
        },
      ],
      rescueParticipants: [
        {
          id: 'volunteer_05',
          name: 'Volunteer Wang',
          avatar: 'https://pawhaven-mock.com/avatars/vol05.jpg',
          role: 'rescuer',
          joinedAt: '2023-11-12T11:30:00Z',
        },
      ],
    },
    stats: {
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
    },
    createdAt: '',
    updatedAt: '',
  };
  return animal;
};

export const updateRescueStatus = (id: string, status: AnimalRescueStatus) => {
  return apiClient.put(`/animal/${id}/status`, { status });
};
