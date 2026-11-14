import { Reflector } from '@nestjs/core';
import { AuthMetadataKey } from '@pawhaven/backend-core/decorators';
import { InternalJwtKind } from '@pawhaven/backend-core/types';
import { describe, expect, it, vi } from 'vitest';

import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';

const CLAIMS = {
  aud: 'document-service',
  iat: 0,
  exp: 0,
  rid: 'trace-1',
  kind: InternalJwtKind.AUTHENTICATED,
  sub: 'user-1',
};

const buildFile = (mimetype: string): Express.Multer.File =>
  ({
    originalname: 'upload.bin',
    buffer: Buffer.from('file-bytes'),
    size: 10,
    mimetype,
  }) as Express.Multer.File;

const buildController = (upload: FilesService['upload']) =>
  new FilesController({ upload } as unknown as FilesService);

describe('FilesController', () => {
  it('allows optional authentication while retaining the internal JWT guard', () => {
    const reflector = new Reflector();

    const isOptional = reflector.getAllAndOverride(AuthMetadataKey.OPTIONAL, [
      FilesController.prototype.upload,
      FilesController,
    ]);
    expect(isOptional).toBeTruthy();
  });

  it('allows anonymous uploads only in the report folder', async () => {
    const upload = vi.fn<FilesService['upload']>().mockResolvedValue([]);
    const controller = buildController(upload);
    const guestClaims = { ...CLAIMS, kind: InternalJwtKind.ANONYMOUS };

    await expect(
      controller.upload(
        [buildFile('image/jpeg')],
        'report-animal',
        guestClaims,
        '203.0.113.5',
      ),
    ).resolves.toEqual({ files: [] });
    expect(upload).toHaveBeenCalledWith(
      [expect.anything()],
      guestClaims,
      'report-animal',
      '203.0.113.5',
    );
    await expect(
      controller.upload(
        [buildFile('image/jpeg')],
        'other-folder',
        guestClaims,
        '203.0.113.5',
      ),
    ).rejects.toThrow('Anonymous uploads are limited to reports');
  });

  it('forwards files, the authenticated user and the folder to the service', async () => {
    const uploaded = [
      {
        key: 'report-animal/a.webp',
        size: 10,
        contentType: 'image/webp',
      },
    ];
    const upload = vi.fn<FilesService['upload']>().mockResolvedValue(uploaded);
    const controller = buildController(upload);
    const jpeg = buildFile('image/jpeg');
    const webp = buildFile('image/webp');

    await expect(
      controller.upload([jpeg, webp], 'report-animal', CLAIMS, '127.0.0.1'),
    ).resolves.toEqual({ files: uploaded });
    expect(upload).toHaveBeenCalledWith(
      [jpeg, webp],
      CLAIMS,
      'report-animal',
      '127.0.0.1',
    );
  });
});
