import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InternalJwtKind, type InternalJwt } from '@pawhaven/backend-core/types';
import {
  FILE_UPLOAD_LIMITS,
  REPORT_PHOTO_LIMITS,
  type UploadedFile,
} from '@pawhaven/shared/types';

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
    claims: InternalJwt,
    folder?: string,
    clientIp?: string,
  ): Promise<UploadedFile[]> {
    const prefix = this.normalizeFolder(folder);
    if (
      claims.kind === InternalJwtKind.ANONYMOUS &&
      prefix !== 'report-animal'
    ) {
      throw new ForbiddenException('Anonymous uploads are limited to reports');
    }

    if (prefix === 'report-animal') {
      files.forEach((file) => {
        if (
          file.size > REPORT_PHOTO_LIMITS.maxSizeBytes ||
          !REPORT_PHOTO_LIMITS.acceptedTypes.some(
            (type) => type === file.mimetype,
          )
        ) {
          throw new BadRequestException('Invalid report photo');
        }
      });
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const limiterKey =
      claims.kind === InternalJwtKind.AUTHENTICATED
        ? `user:${claims.sub}`
        : `ip:${clientIp?.trim() || 'unknown'}`;
    this.rateLimiter.consume(limiterKey, totalBytes);

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
