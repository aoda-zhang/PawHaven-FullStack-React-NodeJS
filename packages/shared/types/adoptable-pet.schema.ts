import { z } from 'zod';

const AdoptableAnimalTypeValues = ['cat', 'dog'] as const;

export const AdoptablePetSchema = z.object({
  id: z.string(),
  name: z.string(),
  animalType: z.enum(AdoptableAnimalTypeValues),
  age: z.string(),
  sex: z.string(),
  breed: z.string(),
  location: z.string(),
  waitingDays: z.number(),
  tags: z.array(z.string()),
  photo: z.string(),
  rescuedFrom: z.string(),
  rescueDuration: z.string(),
  medicalRecords: z.array(z.string()),
  temperament: z.string(),
  adoptionStatus: z
    .enum(['available', 'pending', 'adopted'])
    .default('available'),
});

export type AdoptablePet = z.infer<typeof AdoptablePetSchema>;
