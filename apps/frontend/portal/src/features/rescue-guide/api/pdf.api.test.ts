import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadPdf } from './pdf.api';

import { apiClient } from '@/utils/apiClient';

const { localeState } = vi.hoisted(() => ({
  localeState: { value: 'zh-CN' },
}));

vi.mock('@pawhaven/frontend-core', () => ({
  getLocale: () => localeState.value,
}));

vi.mock('@/utils/apiClient', () => ({
  apiClient: {
    postBlob: vi.fn(),
  },
}));

const mockedPostBlob = vi.mocked(apiClient.postBlob);

const downloadEndpoint = '/document/pdf/download';

describe('pdf api', () => {
  beforeEach(() => {
    mockedPostBlob.mockReset();
    localeState.value = 'zh-CN';
  });

  it('posts the template and active locale to /document/pdf/download and returns a blob', async () => {
    const blob = new Blob(['pdf']);
    mockedPostBlob.mockResolvedValue(blob);

    const result = await downloadPdf('rescueGuide');

    expect(mockedPostBlob).toHaveBeenCalledTimes(1);
    expect(mockedPostBlob).toHaveBeenCalledWith(downloadEndpoint, {
      template: 'rescueGuide',
      locale: 'zh-CN',
      data: {},
    });
    expect(result).toBe(blob);
  });

  it('sends a supported locale when the active one is not supported', async () => {
    localeState.value = 'fr-FR';
    const blob = new Blob(['pdf']);
    mockedPostBlob.mockResolvedValue(blob);

    await downloadPdf('firstAid');

    expect(mockedPostBlob).toHaveBeenCalledWith(downloadEndpoint, {
      template: 'firstAid',
      locale: 'en-US',
      data: {},
    });
  });
});
