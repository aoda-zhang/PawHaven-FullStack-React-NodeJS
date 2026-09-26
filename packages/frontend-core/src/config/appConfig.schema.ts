import { z } from 'zod';

export const frontendAppConfigSchema = z.object({
  env: z.enum(['dev', 'test', 'uat', 'prod']),
  apiBaseUrl: z.string().min(1),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
});

export type FrontendAppConfig = z.infer<typeof frontendAppConfigSchema>;
