import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { put } from '@vercel/blob';

import type { StorageConfig } from '../../../config/storageConfig.schema.js';
import type { FileStorage, StoredFile } from '../fileStorage.js';

type VercelStorageConfig = Extract<StorageConfig, { provider: 'vercel' }>;

@Injectable()
export class VercelBlobStorage implements FileStorage {
  constructor(private readonly configs: ConfigService) {}

  async put(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<StoredFile> {
    const { vercel } = this.configs.getOrThrow<VercelStorageConfig>('storage');

    if (!vercel.token && !vercel.storeId) {
      throw new ServiceUnavailableException(
        'Vercel Blob storage is not configured',
      );
    }

    const blob = await put(key, body, {
      access: 'public',
      contentType,
      ...(vercel.storeId ? { storeId: vercel.storeId } : {}),
      ...(vercel.token ? { token: vercel.token } : {}),
    });

    return {
      key: blob.pathname,
      size: body.length,
      contentType: blob.contentType,
    };
  }
}
