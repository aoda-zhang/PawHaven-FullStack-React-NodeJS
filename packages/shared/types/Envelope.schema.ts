import { z } from 'zod';

/**
 * Global API response envelope.
 *
 * Single source of truth for the envelope the gateway wraps every successful
 * JSON response in (see ADR-002). Mirrors `ApiResponseType` in
 * packages/frontend-core so both sides stay in sync.
 */
export const ApiResponseEnvelopeSchema = z.object({
  status: z.number(),
  isSuccess: z.boolean(),
  message: z.string(),
  code: z.string(),
  data: z.unknown(),
});

export type ApiResponseEnvelope = z.infer<typeof ApiResponseEnvelopeSchema>;
