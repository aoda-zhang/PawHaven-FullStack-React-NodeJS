import { createApiClient } from '@pawhaven/frontend-core';

import { loadConfig } from '@/config';

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
  prefix: loadConfig()?.api?.prefix,
});
