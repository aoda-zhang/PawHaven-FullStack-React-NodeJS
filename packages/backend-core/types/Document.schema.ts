import { z } from 'zod';
import {
  GuideLocaleSchema,
  GuideSlugSchema,
  pdfOptionsSchema,
} from '@pawhaven/shared/types';

const EMAIL_TEMPLATE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const EmailTemplateSchema = z
  .string()
  .regex(EMAIL_TEMPLATE_PATTERN, 'Invalid template name');

export const RenderPdfBodySchema = z.strictObject({
  template: GuideSlugSchema,
  locale: GuideLocaleSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  options: pdfOptionsSchema.optional(),
});

export type RenderPdfBody = z.infer<typeof RenderPdfBodySchema>;

export const SendEmailBodySchema = z.object({
  template: EmailTemplateSchema,
  locale: GuideLocaleSchema,
  payload: z.record(z.string(), z.unknown()).optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export type SendEmailBody = z.infer<typeof SendEmailBodySchema>;

export const PreviewEmailBodySchema = SendEmailBodySchema.pick({
  template: true,
  locale: true,
  payload: true,
});

export type PreviewEmailBody = z.infer<typeof PreviewEmailBodySchema>;
