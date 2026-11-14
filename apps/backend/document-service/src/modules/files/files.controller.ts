import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import {
  InternalJwtKind,
  type InternalJwt as InternalJwtClaims,
} from '@pawhaven/backend-core/types';
import {
  FILE_UPLOAD_LIMITS,
  type FileUploadResult,
} from '@pawhaven/shared/types';

import { FilesService } from './files.service.js';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @OptionalAuth()
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', FILE_UPLOAD_LIMITS.max, {
      limits: {
        fileSize: FILE_UPLOAD_LIMITS.maxSizeBytes,
        files: FILE_UPLOAD_LIMITS.max,
      },
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body('folder') folder: string | undefined,
    @InternalJwt({ allowAnonymous: true }) claims: InternalJwtClaims,
    @Headers('x-gateway-client-ip') clientIp?: string,
  ): Promise<FileUploadResult> {
    if (
      claims.kind === InternalJwtKind.ANONYMOUS &&
      folder !== 'report-animal'
    ) {
      throw new ForbiddenException('Anonymous uploads are limited to reports');
    }
    return {
      files: await this.filesService.upload(
        files ?? [],
        claims,
        folder,
        clientIp,
      ),
    };
  }
}
