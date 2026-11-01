import { z } from 'zod';

export const FILE_UPLOAD_LIMITS = {
  max: 5,
  maxSizeBytes: 5 * 1024 * 1024,
  allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const uploadedFileSchema = z.object({
  key: z.string().min(1),
  size: z.number().int().nonnegative(),
  contentType: z.string().min(1),
});

export const fileUploadResultSchema = z.object({
  files: z.array(uploadedFileSchema),
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;
export type FileUploadResult = z.infer<typeof fileUploadResultSchema>;
