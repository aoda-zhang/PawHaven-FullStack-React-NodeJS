import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadPdf } from './pdf.api';

import { apiClient } from '@/utils/apiClient';

vi.mock('@/utils/apiClient', () => ({
  apiClient: {
    postBlob: vi.fn(),
  },
}));

const mockedPostBlob = vi.mocked(apiClient.postBlob);

/**
 * The request now goes through core-service rather than straight to
 * document-service, so the browser has a single upstream and the request gains
 * a gateway -> core-service -> document-service trace.
 */
const downloadEndpoint = '/core/guide/pdf';

describe('pdf api', () => {
  beforeEach(() => {
    mockedPostBlob.mockReset();
  });

  it('posts the template to /core/guide/pdf and returns a blob', async () => {
    const blob = new Blob(['pdf']);
    mockedPostBlob.mockResolvedValue(blob);

    const result = await downloadPdf('rescueGuide');

    expect(mockedPostBlob).toHaveBeenCalledTimes(1);
    expect(mockedPostBlob).toHaveBeenCalledWith(downloadEndpoint, {
      template: 'rescueGuide',
    });
    expect(result).toBe(blob);
  });

  it('no longer sends the locale in the body, since it travels as a header', async () => {
    mockedPostBlob.mockResolvedValue(new Blob(['pdf']));

    await downloadPdf('firstAid');

    const [, body] = mockedPostBlob.mock.calls[0];
    expect(body).not.toHaveProperty('locale');
    expect(body).not.toHaveProperty('data');
  });
});
