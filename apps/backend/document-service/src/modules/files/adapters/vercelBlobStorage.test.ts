import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VercelBlobStorage } from './vercelBlobStorage.js';

const { putMock } = vi.hoisted(() => ({ putMock: vi.fn() }));

vi.mock('@vercel/blob', () => ({ put: putMock }));

const buildStorage = (token = 'token-123', storeId?: string) => {
  const getOrThrow = vi.fn(() => ({
    provider: 'vercel',
    vercel: { token, storeId },
  }));
  return new VercelBlobStorage({ getOrThrow } as unknown as ConfigService);
};

beforeEach(() => putMock.mockReset());

describe('VercelBlobStorage', () => {
  it('uploads with public access, content type and a random suffix', async () => {
    putMock.mockResolvedValue({
      url: 'https://store.public.blob.vercel-storage.com/uploads/photo-abc.png',
      pathname: 'uploads/photo-abc.png',
      contentType: 'image/png',
    });
    const storage = buildStorage();
    const body = Buffer.from('image-bytes');

    const result = await storage.put('uploads/photo.png', body, 'image/png');

    expect(putMock).toHaveBeenCalledWith('uploads/photo.png', body, {
      access: 'public',
      contentType: 'image/png',
      token: 'token-123',
    });
    expect(result).toEqual({
      key: 'uploads/photo-abc.png',
      size: body.length,
      contentType: 'image/png',
    });
  });

  it('passes the storeId so the SDK prefers OIDC', async () => {
    putMock.mockResolvedValue({
      url: 'https://store.public.blob.vercel-storage.com/uploads/p.png',
      pathname: 'uploads/p.png',
      contentType: 'image/png',
    });
    const storage = buildStorage('token-123', 'store-1');

    await storage.put('uploads/p.png', Buffer.from('x'), 'image/png');

    expect(putMock).toHaveBeenCalledWith('uploads/p.png', expect.anything(), {
      access: 'public',
      contentType: 'image/png',
      storeId: 'store-1',
      token: 'token-123',
    });
  });

  it('supports OIDC-only config (storeId, no token)', async () => {
    putMock.mockResolvedValue({
      url: 'https://store.public.blob.vercel-storage.com/uploads/p.png',
      pathname: 'uploads/p.png',
      contentType: 'image/png',
    });
    const storage = buildStorage('', 'store-1');

    await storage.put('uploads/p.png', Buffer.from('x'), 'image/png');

    expect(putMock).toHaveBeenCalledWith('uploads/p.png', expect.anything(), {
      access: 'public',
      contentType: 'image/png',
      storeId: 'store-1',
    });
  });

  it('fails clearly when neither token nor storeId is configured', async () => {
    const storage = buildStorage('');

    await expect(
      storage.put('uploads/photo.png', Buffer.from('x'), 'image/png'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(putMock).not.toHaveBeenCalled();
  });
});
