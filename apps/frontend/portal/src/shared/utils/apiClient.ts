import { createApiClient } from '@pawhaven/frontend-core';
import type { FileUploadResult } from '@pawhaven/shared/types';

import { loadConfig } from '@/config';

const FILE_UPLOAD_TIMEOUT_MS = 60_000;

/**
 * Create a single shared API client instance for this app.
 * Ensures all API requests share the same configuration.
 *
 * Authentication is backend-driven.
 * When gateway/backend returns 401, frontend-core global handlers redirect to login.
 */
export const apiClient = createApiClient({
  timeout: loadConfig()?.api?.timeout,
  baseURL: '/api',
});

interface UploadFilesOptions {
  endpoint: string;
  folder?: string;
}

export const uploadFiles = (
  files: File[],
  { endpoint, folder }: UploadFilesOptions,
): Promise<FileUploadResult> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (folder) {
    formData.append('folder', folder);
  }
  return apiClient.post<FileUploadResult, FormData>(endpoint, formData, {
    timeout: FILE_UPLOAD_TIMEOUT_MS,
  });
};
