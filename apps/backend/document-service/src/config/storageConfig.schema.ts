import { z } from '@pawhaven/backend-core/config-module';

const vercelStorageSchema = z.object({
  provider: z.literal('vercel'),
  vercel: z
    .object({
      token: z.string().optional(),
      storeId: z.string().optional(),
    })
    .superRefine((vercel, ctx) => {
      if (!vercel.token && !vercel.storeId) {
        ctx.addIssue({
          code: 'custom',
          path: ['token'],
          message: 'storage.vercel requires a token or a storeId',
        });
      }
    }),
});

export const storageConfigSchema = vercelStorageSchema;

export type StorageConfig = z.infer<typeof storageConfigSchema>;
