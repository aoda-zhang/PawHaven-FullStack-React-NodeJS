import { z } from 'zod';

export const ConfigSchema = z.object({
  env: z.enum(['dev', 'uat', 'prod', 'test']),
  version: z.string(),

  featureFlags: z.object({
    enableBetaFeature: z.boolean(),
    enableMaintenance: z.boolean(),
  }),

  api: z.object({
    baseURL: z.string(),
    timeout: z.number().min(100),
  }),

  query: z.object({
    refetchOnReconnect: z.boolean(),
    refetchOnWindowFocus: z.boolean(),
    staleTime: z.number(),
    gcTime: z.number(),
  }),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
