import { getLocale } from '@pawhaven/frontend-core';
import { normalizeLocale, type GuideLocale } from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

interface PdfRenderRequest {
  template: string;
  locale: GuideLocale;
  data: Record<string, unknown>;
}

export const downloadPdf = (template: string): Promise<Blob> =>
  apiClient.postBlob<PdfRenderRequest>('/document/pdf/download', {
    template,
    locale: normalizeLocale(getLocale()),
    data: {},
  });
