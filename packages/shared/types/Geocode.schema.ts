import { z } from 'zod';

export const ReverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  lang: z
    .string()
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
    .optional(),
});

export type ReverseGeocodeQuery = z.infer<typeof ReverseGeocodeQuerySchema>;

export const ReverseGeocodeResultSchema = z.object({
  address: z.string(),
});

export type ReverseGeocodeResult = z.infer<typeof ReverseGeocodeResultSchema>;
