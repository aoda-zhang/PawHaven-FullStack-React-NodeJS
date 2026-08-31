import { z } from 'zod';

import { AnimalAppearanceSchema, RescueAgeSchema } from './rescue.schema';

/**
 * Report Animal Schemas
 */

const phoneRegex = /^[\d\s\-+()]{7,20}$/;

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const MAX_PHOTO_SIZE_MB = 10;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * BYTES_PER_MB;
const BASE64_CHARS_PER_GROUP = 4;
const BASE64_BYTES_PER_GROUP = 3;
const CONTACT_NAME_MAX_LENGTH = 50;
const CONTACT_EMAIL_MAX_LENGTH = 100;

/**
 * Reporter photo upload limits (shared by form validation and API schema).
 */
export const REPORT_PHOTO_LIMITS = {
  min: 2,
  max: 5,
  maxSizeBytes: MAX_PHOTO_SIZE_BYTES,
} as const;

const supportedPhotoPrefixes = [
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/png;base64,',
] as const;

const photoDataUrlSchema = z
  .string()
  .min(1, 'Photo is required')
  .refine(
    (value) =>
      supportedPhotoPrefixes.some((prefix) => value.startsWith(prefix)),
    'Only JPG, JPEG or PNG images are allowed',
  )
  .refine((value) => {
    const payload = value.slice(value.indexOf(',') + 1);
    const decodedBytes =
      Math.floor(payload.length / BASE64_CHARS_PER_GROUP) *
      BASE64_BYTES_PER_GROUP;
    return decodedBytes <= REPORT_PHOTO_LIMITS.maxSizeBytes;
  }, `Each photo must be under ${MAX_PHOTO_SIZE_MB}MB`);

export const reporterPhotosSchema = z
  .array(photoDataUrlSchema)
  .min(REPORT_PHOTO_LIMITS.min, 'At least 2 photos are required')
  .max(REPORT_PHOTO_LIMITS.max, 'At most 5 photos are allowed');

const contactInfoSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(
        CONTACT_NAME_MAX_LENGTH,
        `Name too long (max ${CONTACT_NAME_MAX_LENGTH} characters)`,
      ),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(phoneRegex, 'Invalid phone number'),
    email: z
      .string()
      .email('Invalid email address')
      .max(CONTACT_EMAIL_MAX_LENGTH, 'Email too long')
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
    age: RescueAgeSchema,
    appearance: AnimalAppearanceSchema,
    location: z.object({
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
    foundTime: z.string().min(1, 'Found time is required'),
    status: z.enum(['dangerous', 'friendly', 'scared', 'other']),
    statusDescription: z.string().optional(),
    reporterPhotos: reporterPhotosSchema,
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
  behaviorRequired: string;
  contactRequired: string;
}

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png'];

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
              (file) => ALLOWED_PHOTO_TYPES.includes(file.type),
              messages.photosFormat,
            )
            .refine(
              (file) => file.size <= REPORT_PHOTO_LIMITS.maxSizeBytes,
              messages.photosSize,
            ),
        )
        .min(REPORT_PHOTO_LIMITS.min, messages.photosRequired)
        .max(REPORT_PHOTO_LIMITS.max, messages.photosMax),
      urgencyChecks: z.object({
        bleeding: z.boolean(),
        cantMove: z.boolean(),
        dangerZone: z.boolean(),
        breathing: z.boolean(),
      }),
      contactPhone: z
        .string()
        .min(1, messages.contactRequired)
        .regex(phoneRegex, messages.contactRequired),
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
