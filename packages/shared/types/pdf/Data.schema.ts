import { z } from 'zod';

const copyText = z.string().min(1);

export const pdfSectionSchema = z.object({
  title: copyText,
  text: copyText,
  bullets: z.array(copyText).optional(),
});

export const pdfChecklistSchema = z.object({
  title: copyText,
  items: z.array(copyText),
});

export const pdfContactItemSchema = z.object({
  label: copyText,
  value: copyText,
});

export const pdfContactsSchema = z.object({
  title: copyText,
  items: z.array(pdfContactItemSchema),
});

export const pdfProvenanceSchema = z.object({
  source: z.string(),
  url: z.string().optional(),
  reviewedAt: z.string().optional(),
});

export type PdfSection = z.infer<typeof pdfSectionSchema>;
export type PdfChecklist = z.infer<typeof pdfChecklistSchema>;
export type PdfContactItem = z.infer<typeof pdfContactItemSchema>;
export type PdfContacts = z.infer<typeof pdfContactsSchema>;
export type PdfProvenance = z.infer<typeof pdfProvenanceSchema>;
