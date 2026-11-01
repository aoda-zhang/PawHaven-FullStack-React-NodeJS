import { ServiceUnavailableException, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { StorageConfig } from '../../config/storageConfig.schema.js';

import { VercelBlobStorage } from './adapters/vercelBlobStorage.js';
import { FILE_STORAGE, type FileStorage } from './fileStorage.js';

export const fileStorageProvider: Provider = {
  provide: FILE_STORAGE,
  inject: [ConfigService],
  useFactory: (configs: ConfigService): FileStorage => {
    const { provider } = configs.getOrThrow<StorageConfig>('storage');

    switch (provider) {
      case 'vercel':
        return new VercelBlobStorage(configs);
      default:
        throw new ServiceUnavailableException(
          `Unsupported storage provider: ${String(provider)}`,
        );
    }
  },
};
