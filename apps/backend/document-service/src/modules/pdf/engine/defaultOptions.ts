import type { PdfMargin, PdfOptions } from '@pawhaven/shared/types';

export type ResolvedPdfOptions = Omit<Required<PdfOptions>, 'margin'> & {
  margin: Required<PdfMargin>;
};

export const defaultPdfOptions: ResolvedPdfOptions = {
  format: 'A4',
  landscape: false,
  scale: 1,
  margin: { top: '70px', bottom: '70px', left: '0', right: '0' },
  printBackground: true,
  displayHeaderFooter: true,
  preferCSSPageSize: false,
};
