import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { InternalJwtKind } from '@pawhaven/backend-core/types';

import type { FileStorage } from './fileStorage.js';
import { FilesService } from './files.service.js';
import type { UploadRateLimiter } from './uploadRateLimiter.js';

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF_BYTES = Buffer.from('%PDF-1.7\n');
const CLAIMS = { kind: InternalJwtKind.AUTHENTICATED, sub: 'user-1' };
const GUEST_CLAIMS = { kind: InternalJwtKind.ANONYMOUS };

const buildFile = (overrides: Partial<Express.Multer.File> = {}) =>
  ({
    originalname: 'whatever.png',
    buffer: PNG_BYTES,
    size: 10,
    mimetype: 'image/png',
    ...overrides,
  }) as Express.Multer.File;

const buildService = (put: FileStorage['put'], consume = vi.fn()) =>
  new FilesService(
    { put } as FileStorage,
    {
      consume,
    } as unknown as UploadRateLimiter,
  );

const storedFile = (key: string) => ({
  key,
  size: 10,
  contentType: 'image/png',
});

describe('FilesService', () => {
  it('throttles by user and total bytes before uploading', async () => {
    const put = vi
      .fn<FileStorage['put']>()
      .mockResolvedValue(storedFile('uploads/x.png'));
    const consume = vi.fn();
    const service = buildService(put, consume);

    await service.upload(
      [buildFile({ size: 5 }), buildFile({ size: 7 })],
      CLAIMS,
    );

    expect(consume).toHaveBeenCalledWith(CLAIMS.sub, 12);
  });

  it('does not apply the per-user upload limiter to guest uploads', async () => {
    const put = vi
      .fn<FileStorage['put']>()
      .mockResolvedValue(storedFile('report-animal/x.png'));
    const consume = vi.fn();
    const service = buildService(put, consume);

    await service.upload([buildFile()], GUEST_CLAIMS, 'report-animal');

    expect(consume).not.toHaveBeenCalled();
    expect(put).toHaveBeenCalledOnce();
  });

  it('uploads under the default folder with a short uuid key (no original filename)', async () => {
    const put = vi
      .fn<FileStorage['put']>()
      .mockResolvedValue(storedFile('uploads/x.png'));
    const service = buildService(put);

    await service.upload(
      [buildFile({ originalname: '../../etc/passwd' })],
      CLAIMS,
    );

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/[A-Za-z0-9_-]{22}\.png$/),
      PNG_BYTES,
      'image/png',
    );
  });

  it('namespaces under a caller-provided folder', async () => {
    const put = vi
      .fn<FileStorage['put']>()
      .mockResolvedValue(storedFile('report-animal/x.png'));
    const service = buildService(put);

    await service.upload([buildFile()], CLAIMS, 'report-animal');

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^report-animal\/[A-Za-z0-9_-]{22}\.png$/),
      PNG_BYTES,
      'image/png',
    );
  });

  it('sanitises a traversal folder back to the default folder', async () => {
    const put = vi
      .fn<FileStorage['put']>()
      .mockResolvedValue(storedFile('uploads/x.png'));
    const service = buildService(put);

    await service.upload([buildFile()], CLAIMS, '../..');

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/[A-Za-z0-9_-]{22}\.png$/),
      PNG_BYTES,
      'image/png',
    );
  });

  it('rejects a file whose declared mime does not match its bytes', async () => {
    const put = vi.fn<FileStorage['put']>();
    const service = buildService(put);

    await expect(
      service.upload([buildFile({ mimetype: 'image/jpeg' })], USER),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects unknown content', async () => {
    const put = vi.fn<FileStorage['put']>();
    const service = buildService(put);

    await expect(
      service.upload(
        [buildFile({ buffer: Buffer.from('not-an-image') })],
        CLAIMS,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects a PDF because only images are allowed', async () => {
    const put = vi.fn<FileStorage['put']>();
    const service = buildService(put);

    await expect(
      service.upload(
        [
          buildFile({
            originalname: 'a.pdf',
            buffer: PDF_BYTES,
            mimetype: 'application/pdf',
          }),
        ],
        CLAIMS,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(put).not.toHaveBeenCalled();
  });
});
