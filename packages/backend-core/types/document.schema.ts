import { z } from 'zod';

/**
 * Document (PDF / email) request contracts.
 *
 * `template` is interpolated into a dynamic `import()` path by document-service
 * (`./templates/${template}/index.tsx`), so it is deliberately restricted to a
 * slug — an unrestricted string lets a caller climb out of the templates folder.
 * The concrete template set stays open on purpose: adding one must not require a
 * contract change.
 */
const TEMPLATE_PATTERN = /^[a-z][a-z0-9_]*$/;

const LOCALE_PATTERN = /^[a-zA-Z]{2}(-[a-zA-Z]{2})?$/;

/** Template payloads are template-specific, so only the envelope is validated. */
const templateDataSchema = z.record(z.string(), z.unknown());

const localeSchema = z
  .string()
  .regex(LOCALE_PATTERN, 'Invalid locale')
  .optional()
  .default('en');

export const DocumentTemplateSchema = z
  .string()
  .regex(TEMPLATE_PATTERN, 'Invalid template name');

export const GeneratePdfBodySchema = z.object({
  template: DocumentTemplateSchema,
  locale: localeSchema,
  PDFContentData: templateDataSchema.optional(),
  PDFHeaderData: templateDataSchema.optional(),
  PDFFooterData: templateDataSchema.optional(),
  PDFOptions: templateDataSchema.optional(),
});

export type GeneratePdfBody = z.infer<typeof GeneratePdfBodySchema>;

export const SendEmailBodySchema = z.object({
  template: DocumentTemplateSchema,
  locale: localeSchema,
  payload: templateDataSchema.optional(),
  options: templateDataSchema.optional(),
});

export type SendEmailBody = z.infer<typeof SendEmailBodySchema>;

export const PreviewEmailBodySchema = SendEmailBodySchema.pick({
  template: true,
  locale: true,
  payload: true,
});

export type PreviewEmailBody = z.infer<typeof PreviewEmailBodySchema>;
