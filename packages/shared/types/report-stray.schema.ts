import { z } from 'zod';

/**
 * Report Stray Animal Schemas
 */

const phoneRegex = /^[\d\s\-+()]{7,20}$/;

const colorSchema = z.string().min(1, 'Color is required').max(50);

const appearanceSchema = z.object({
  color: colorSchema,
  hasInjury: z.boolean(),
  injuryDescription: z.string().optional(),
  otherFeatures: z.string().optional(),
});

const contactInfoSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name too long (max 50 characters)'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(phoneRegex, 'Invalid phone number'),
    email: z
      .string()
      .email('Invalid email address')
      .max(100, 'Email too long')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.email && data.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(data.email);
      }
      return true;
    },
    { path: ['email'], message: 'Invalid email address' },
  );

export const AnimalReportSchema = z
  .object({
    animalType: z.string().min(1, 'Animal type is required'),
    animalTypeOther: z.string().optional(),
    age: z.enum(['baby', 'young', 'adult', 'senior']),
    appearance: appearanceSchema,
    location: z.object({
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
    foundTime: z.string().min(1, 'Found time is required'),
    status: z.enum(['dangerous', 'friendly', 'scared', 'other']),
    statusDescription: z.string().optional(),
    images: z.array(z.any()).optional(),
    contactInfo: contactInfoSchema,
  })
  .superRefine((data, ctx) => {
    if (
      data.animalType === 'other' &&
      (!data.animalTypeOther || !data.animalTypeOther.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify the animal type',
        path: ['animalTypeOther'],
      });
    }
    if (data.appearance.hasInjury) {
      if (
        !data.appearance.injuryDescription ||
        !data.appearance.injuryDescription.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please describe the injury',
          path: ['appearance', 'injuryDescription'],
        });
      }
    }
  });

export type AnimalReportDto = z.infer<typeof AnimalReportSchema>;
