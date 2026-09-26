import { apiClient } from '@/utils/apiClient';

interface PdfRenderRequest {
  template: string;
}

/**
 * The locale is no longer sent in the body: core-service resolves it from the
 * `X-locale` header that the API client already attaches, and forwards it to
 * document-service from there.
 */
export const downloadPdf = (template: string): Promise<Blob> =>
  apiClient.postBlob<PdfRenderRequest>('/core/guide/pdf', { template });
