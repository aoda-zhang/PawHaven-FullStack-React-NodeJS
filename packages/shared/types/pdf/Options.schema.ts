import { z } from 'zod';

const pdfLengthSchema = z
  .string()
  .regex(/^\d+(\.\d+)?(px|in|cm|mm)?$/, 'Invalid PDF length');

export const pdfPaperFormats = [
  'A4',
  'A3',
  'A5',
  'LETTER',
  'LEGAL',
  'TABLOID',
] as const;
export const PdfPaperFormatSchema = z.enum(pdfPaperFormats);

export const pdfMarginSchema = z.strictObject({
  top: pdfLengthSchema.optional(),
  bottom: pdfLengthSchema.optional(),
  left: pdfLengthSchema.optional(),
  right: pdfLengthSchema.optional(),
});

export const pdfOptionsSchema = z.strictObject({
  format: PdfPaperFormatSchema.optional(),
  landscape: z.boolean().optional(),
  scale: z.number().min(0.1).max(2).optional(),
  margin: pdfMarginSchema.optional(),
  printBackground: z.boolean().optional(),
  displayHeaderFooter: z.boolean().optional(),
  preferCSSPageSize: z.boolean().optional(),
});

export type PdfOptions = z.infer<typeof pdfOptionsSchema>;
export type PdfMargin = z.infer<typeof pdfMarginSchema>;
export type PdfPaperFormat = z.infer<typeof PdfPaperFormatSchema>;
