import { Module } from '@nestjs/common';

import { fileStorageProvider } from './fileStorage.provider.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';
import { UploadRateLimiter } from './uploadRateLimiter.js';

@Module({
  controllers: [FilesController],
  providers: [fileStorageProvider, UploadRateLimiter, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
