import { z } from 'zod';

import {
  AnimalAppearanceSchema,
  RescueAgeSchema,
  RescueLocationSchema,
} from './Rescue.schema.js';

/**
 * Report Animal Schemas
 */

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const MAX_PHOTO_SIZE_MB = 2;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * BYTES_PER_MB;
const CONTACT_EMAIL_MAX_LENGTH = 100;

/**
 * Reporter photo upload limits (shared by form validation and API schema).
 */
export const REPORT_PHOTO_LIMITS = {
  min: 2,
  max: 5,
  maxSizeBytes: MAX_PHOTO_SIZE_BYTES,
  acceptedTypes: ['image/jpeg', 'image/png'],
  accept: 'image/jpeg,image/png,.jpg,.jpeg,.png',
} as const;

const storageKeySchema = z
  .string()
  .min(1)
  .refine(
    (key) =>
      !key.includes('://') &&
      !key.startsWith('/') &&
      !key.split('/').includes('..'),
    'Each photo must be a storage key',
  );

export const reporterPhotosSchema = z
  .array(storageKeySchema)
  .min(REPORT_PHOTO_LIMITS.min, 'At least 2 photos are required')
  .max(REPORT_PHOTO_LIMITS.max, 'At most 5 photos are allowed');

const contactInfoSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(CONTACT_EMAIL_MAX_LENGTH, 'Email too long')
    .optional()
    .or(z.literal('')),
});

export const AnimalReportSchema = z.object({
  animalType: z.string().min(1, 'Animal type is required'),
  age: RescueAgeSchema,
  size: z.string().min(1, 'Size is required'),
  animalCount: z.number().int().min(1, 'Animal count is required'),
  appearance: AnimalAppearanceSchema,
  location: RescueLocationSchema,
  status: z.enum(['dangerous', 'friendly', 'scared', 'other']),
  statusDescription: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(200, 'Description too long (max 200 characters)'),
  reporterPhotos: reporterPhotosSchema,
  contactInfo: contactInfoSchema,
});

export type AnimalReportDto = z.infer<typeof AnimalReportSchema>;

export const ANIMAL_TYPES = [
  { value: 'cat' },
  { value: 'dog' },
  { value: 'other' },
] as const;

export type AnimalType = (typeof ANIMAL_TYPES)[number]['value'];

export const SIZES = [
  { value: 'small' },
  { value: 'medium' },
  { value: 'large' },
] as const;

export type Size = (typeof SIZES)[number]['value'];

export const BEHAVIORS = [
  { value: 'friendly' },
  { value: 'wary' },
  { value: 'aggressive' },
  { value: 'unknown' },
] as const;

export type Behavior = (typeof BEHAVIORS)[number]['value'];

export interface ReportAnimalFormMessages {
  colorRequired: string;
  addressRequired: string;
  photosInvalid: string;
  photosFormat: string;
  photosSize: string;
  photosRequired: string;
  photosMax: string;
  otherRequired: string;
  sizeRequired: string;
  ageRequired: string;
  behaviorRequired: string;
  emailInvalid: string;
  descriptionRequired: string;
  descriptionMax: string;
}

const isBrowserFile = (value: unknown): boolean =>
  typeof File !== 'undefined' && value instanceof File;

const animalTypeEnum = z.enum(
  ANIMAL_TYPES.map((type) => type.value) as [AnimalType, ...AnimalType[]],
);
const sizeEnum = z.enum(SIZES.map((size) => size.value) as [Size, ...Size[]]);
const behaviorEnum = z.enum(
  BEHAVIORS.map((behavior) => behavior.value) as [Behavior, ...Behavior[]],
);

export const createReportAnimalFormSchema = (
  messages: ReportAnimalFormMessages,
) =>
  z
    .object({
      animalType: animalTypeEnum,
      animalCount: z.number().int().min(1),
      otherAnimalType: z.string(),
      coatColor: z.string().trim().min(1, messages.colorRequired),
      age: RescueAgeSchema.nullable(),
      size: sizeEnum.nullable(),
      behavior: behaviorEnum.nullable(),
      address: z.string().trim().min(1, messages.addressRequired),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      photos: z
        .array(
          z
            .custom<File>(isBrowserFile, messages.photosInvalid)
            .refine(
              (file) =>
                REPORT_PHOTO_LIMITS.acceptedTypes.some(
                  (type) => type === file.type,
                ),
              messages.photosFormat,
            )
            .refine(
              (file) => file.size <= REPORT_PHOTO_LIMITS.maxSizeBytes,
              messages.photosSize,
            ),
        )
        .min(REPORT_PHOTO_LIMITS.min, messages.photosRequired)
        .max(REPORT_PHOTO_LIMITS.max, messages.photosMax),
      urgent: z.boolean(),
      description: z
        .string()
        .trim()
        .min(1, messages.descriptionRequired)
        .max(200, messages.descriptionMax),
      contactEmail: z
        .string()
        .trim()
        .email(messages.emailInvalid)
        .max(CONTACT_EMAIL_MAX_LENGTH, messages.emailInvalid)
        .or(z.literal('')),
    })
    .superRefine((data, ctx) => {
      if (data.animalType === 'other' && !data.otherAnimalType.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.otherRequired,
          path: ['otherAnimalType'],
        });
      }
      if (data.size === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.sizeRequired,
          path: ['size'],
        });
      }
      if (data.age === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.ageRequired,
          path: ['age'],
        });
      }
      if (data.behavior === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.behaviorRequired,
          path: ['behavior'],
        });
      }
    });

export type ReportAnimalFormValues = z.infer<
  ReturnType<typeof createReportAnimalFormSchema>
>;
