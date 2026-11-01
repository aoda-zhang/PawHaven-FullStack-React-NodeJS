import '@testing-library/jest-dom/vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadFiles } from './apiClient';

const postMock = vi.hoisted(() => vi.fn());

vi.mock('@/config', () => ({
  loadConfig: () => ({ api: { timeout: 1000 } }),
}));

vi.mock('@pawhaven/frontend-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@pawhaven/frontend-core')>();
  return {
    ...actual,
    createApiClient: () => ({ post: postMock }),
  };
});

const blobResult = {
  files: [{ key: 'uploads/a.jpg', size: 1, contentType: 'image/jpeg' }],
};

describe('uploadFiles', () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it('posts multipart to the given endpoint with folder', async () => {
    const first = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    postMock.mockResolvedValue(blobResult);

    const result = await uploadFiles([first], {
      endpoint: '/document/files',
      folder: 'report-animal',
    });

    expect(postMock).toHaveBeenCalledWith(
      '/document/files',
      expect.any(FormData),
    );
    const formData = postMock.mock.calls[0]?.[1] as FormData;
    expect(formData.getAll('files')).toEqual([first]);
    expect(formData.get('folder')).toBe('report-animal');
    expect(result).toEqual(blobResult);
  });

  it('omits the folder field when not provided', async () => {
    postMock.mockResolvedValue({ files: [] });

    await uploadFiles([new File(['a'], 'a.jpg', { type: 'image/jpeg' })], {
      endpoint: '/files',
    });

    const formData = postMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get('folder')).toBeNull();
  });
});
