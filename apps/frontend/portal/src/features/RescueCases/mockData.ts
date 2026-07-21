import type { RescueCase } from './types';

export const mockRescueCases: RescueCase[] = [
  {
    id: 'PAW-0421',
    title: 'Injured White Cat',
    animalType: 'cat',
    status: 'inProgress',
    urgency: 'high',
    location: 'Garden Road, Chaoyang District',
    distance: '2.1 km',
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=500&fit=crop&auto=format',
    reporter: 'Anonymous',
    description:
      'White cat with injured right hind leg. Hiding under a parked car near the bus stop at Garden Road. Seems wary of people but does not appear aggressive. Has been there for at least 2 hours.',
    reportedAt: '35 min ago',
  },
  {
    id: 'PAW-0418',
    title: 'Stray Brown Dog',
    animalType: 'dog',
    status: 'pending',
    urgency: 'normal',
    location: 'Oak Avenue, Haidian District',
    distance: '3.5 km',
    image:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=500&fit=crop&auto=format',
    reporter: 'Zhang Wei',
    description:
      'Medium-sized brown dog wandering near the park entrance on Oak Avenue. Appears malnourished but friendly — came up to me when I knelt down. No collar.',
    reportedAt: '1 hr ago',
  },
  {
    id: 'PAW-0415',
    title: 'Newborn Kittens Found',
    animalType: 'cat',
    status: 'pending',
    urgency: 'high',
    location: 'Pine Street, Xicheng District',
    distance: '0.8 km',
    image:
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=500&fit=crop&auto=format',
    reporter: 'Liu Yan',
    description:
      '3 newborn kittens found under a dumpster on Pine Street, behind the flower market. No mother in sight for over 90 minutes. Eyes still closed — extremely vulnerable. Urgent help needed.',
    reportedAt: '2 hrs ago',
  },
  {
    id: 'PAW-0409',
    title: 'Senior Golden Retriever',
    animalType: 'dog',
    status: 'recovering',
    urgency: 'normal',
    location: 'Maple Lane, Dongcheng District',
    distance: '5.2 km',
    image:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=500&fit=crop&auto=format',
    reporter: 'Wang Fang',
    description:
      'Elderly golden retriever found limping near the temple. Estimated 10+ years old. Very gentle and well-trained — likely lost rather than abandoned.',
    reportedAt: '6 days ago',
  },
];
