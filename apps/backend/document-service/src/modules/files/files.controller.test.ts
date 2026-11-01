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
  it('is not marked public, so the global internal JWT guard applies', () => {
    const reflector = new Reflector();

    const isPublic = reflector.getAllAndOverride(AuthMetadataKey.PUBLIC, [
      FilesController.prototype.upload,
      FilesController,
    ]);

    expect(isPublic).toBeFalsy();
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
      controller.upload([jpeg, webp], 'report-animal', CLAIMS),
    ).resolves.toEqual({ files: uploaded });
    expect(upload).toHaveBeenCalledWith(
      [jpeg, webp],
      'user-1',
      'report-animal',
    );
  });
});
