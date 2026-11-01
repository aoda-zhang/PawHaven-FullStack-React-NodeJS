import { randomUUID } from 'node:crypto';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FILE_UPLOAD_LIMITS, type UploadedFile } from '@pawhaven/shared/types';

import { detectContentType } from './fileSignature.js';
import { FILE_STORAGE, type FileStorage } from './fileStorage.js';
import { UploadRateLimiter } from './uploadRateLimiter.js';

const DEFAULT_FOLDER = 'uploads';
const toShortUuid = (): string =>
  Buffer.from(randomUUID().replace(/-/g, ''), 'hex').toString('base64url');

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class FilesService {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    private readonly rateLimiter: UploadRateLimiter,
  ) {}

  async upload(
    files: Express.Multer.File[],
    userId: string,
    folder?: string,
  ): Promise<UploadedFile[]> {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    this.rateLimiter.consume(userId, totalBytes);

    const prefix = this.normalizeFolder(folder);

    return Promise.all(
      files.map((file) => {
        const contentType = this.resolveContentType(file);
        const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? 'bin';

        return this.storage.put(
          `${prefix}/${toShortUuid()}.${extension}`,
          file.buffer,
          contentType,
        );
      }),
    );
  }

  private resolveContentType(file: Express.Multer.File): string {
    const detected = detectContentType(file.buffer);
    const allowed = FILE_UPLOAD_LIMITS.allowedContentTypes;

    if (
      !detected ||
      detected !== file.mimetype ||
      !allowed.some((type) => type === detected)
    ) {
      throw new BadRequestException(
        'File content does not match an allowed image type',
      );
    }

    return detected;
  }

  private normalizeFolder(folder?: string): string {
    const segments = (folder ?? '')
      .split('/')
      .map((segment) => segment.trim())
      .filter((segment) => segment && segment !== '.' && segment !== '..')
      .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '-'));

    return segments.length > 0 ? segments.join('/') : DEFAULT_FOLDER;
  }
}
