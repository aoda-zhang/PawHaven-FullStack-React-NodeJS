import type { AdoptablePet } from './types';

export const heroStatValues = {
  rescues: '8,412',
  adopted: '3,207',
  volunteers: '1,940',
} as const;

export const mockAdoptablePets: AdoptablePet[] = [
  {
    id: 'A001',
    name: 'Snowflake',
    animalType: 'cat',
    age: '~1 year',
    sex: 'Female (spayed)',
    breed: 'Domestic Shorthair',
    location: 'Happy Paws Shelter · Chaoyang',
    waitingDays: 3,
    tags: ['Gentle', 'Litter-trained', 'Good with children'],
    photo:
      'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Garden Road',
    rescueDuration: '32 days',
    medicalRecords: [
      'Rabies vaccine',
      'Deworming',
      'Spayed',
      'FIV/FeLV negative',
    ],
    temperament:
      'Gentle and seeks human attention. Purrs readily. Good with other cats.',
  },
  {
    id: 'A002',
    name: 'Caramel',
    animalType: 'dog',
    age: '~2 years',
    sex: 'Male (neutered)',
    breed: 'Labrador Mix',
    location: 'Sunshine Shelter · Haidian',
    waitingDays: 12,
    tags: ['Playful', 'Leash-trained', 'Good with dogs'],
    photo:
      'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Zhongguancun Plaza',
    rescueDuration: '45 days',
    medicalRecords: [
      'Rabies vaccine',
      'Deworming',
      'Neutered',
      'Distemper vaccine',
    ],
    temperament:
      'Energetic and friendly. Loves fetch. Gets along well with other dogs.',
  },
  {
    id: 'A003',
    name: 'Mochi',
    animalType: 'cat',
    age: '~3 months',
    sex: 'Male',
    breed: 'Domestic Shorthair',
    location: 'Happy Paws Shelter · Chaoyang',
    waitingDays: 7,
    tags: ['Playful', 'Curious', 'Bottle-fed'],
    photo:
      'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Pine Street',
    rescueDuration: '21 days',
    medicalRecords: ['First vaccines', 'Deworming', 'Healthy'],
    temperament:
      'Curious and playful. Has been socialized with humans from birth. Will need plenty of attention.',
  },
  {
    id: 'A004',
    name: 'Luna',
    animalType: 'dog',
    age: '~4 years',
    sex: 'Female (spayed)',
    breed: 'Border Collie Mix',
    location: 'Green Hope Shelter · Dongcheng',
    waitingDays: 28,
    tags: ['Intelligent', 'Active', 'Needs space'],
    photo:
      'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=600&h=400&fit=crop&auto=format',
    rescuedFrom: 'Olympic Park',
    rescueDuration: '60 days',
    medicalRecords: [
      'Full vaccine course',
      'Spayed',
      'Dental cleaning',
      'Hip X-ray normal',
    ],
    temperament:
      'Highly intelligent and alert. Needs an active family with space. Best as only dog.',
  },
];
