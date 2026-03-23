import { z } from 'zod';

export const ConfigSchema = z.object({
  env: z.enum(['dev', 'uat', 'prod', 'test']),
  version: z.string(),

  featureFlags: z.object({
    enableBetaFeature: z.boolean(),
    enableMaintenance: z.boolean(),
  }),

  api: z.object({
    enableSign: z.boolean(),
    baseURL: z.string(),
    prefix: z.string(),
    timeout: z.number().min(100),
    privateKey: z.string(),
  }),

  query: z.object({
    refetchOnReconnect: z.boolean(),
    refetchOnFocus: z.boolean(),
    refetchOnWindowFocus: z.boolean(),
    staleTime: z.number(),
    gcTime: z.number(),
  }),

  // sentry: z.object({
  //   dsn: z.string().optional(),
  // }),

  // analytics: z.object({
  //   id: z.string().optional(),
  // }),

  // services: z.object({
  //   user: z.httpUrl(),
  //   notification: z.httpUrl(),
  // }),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
