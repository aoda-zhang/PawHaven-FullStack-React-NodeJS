import { Controller, Get, Post, Param, Query, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import {
  CreateRescueDtoSchema,
  type CreateRescueDto,
} from '@pawhaven/shared/types';
import type { Response } from 'express';

import { RescueService } from './rescue.service';

const SECONDS_PER_YEAR = 31536000;

const PHOTO_CACHE_CONTROL = `public, max-age=${SECONDS_PER_YEAR}, immutable`;

@ApiTags('rescues')
@Controller('rescues')
export class RescueController {
  constructor(private readonly rescueService: RescueService) {}

  @Post()
  @ApiOperation({ summary: 'Create a rescue record' })
  create(
    @Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto,
    @InternalJwt() claims: AuthenticatedInternalJwt,
  ) {
    return this.rescueService.create(dto, claims);
  }

  @OptionalAuth()
  @Get()
  @ApiOperation({
    summary:
      'Get rescues, optionally filter by status or limit the result count. Returns user-relevant rescues if authenticated.',
  })
  findAll(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.rescueService.findAll(
      status,
      limit ? Number(limit) : undefined,
    );
  }

  @OptionalAuth()
  @Get(':id/photo/:index')
  @ApiOperation({ summary: 'Stream a reporter photo of a rescue record' })
  async findPhoto(
    @Param('id') id: string,
    @Param('index') index: string,
    @Res() res: Response,
  ): Promise<void> {
    const photo = await this.rescueService.findPhoto(id, Number(index));
    res.set({
      'Content-Type': photo.mimeType,
      'Cache-Control': PHOTO_CACHE_CONTROL,
    });
    res.end(photo.buffer);
  }

  @OptionalAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get rescue by ID' })
  findOne(@Param('id') id: string) {
    return this.rescueService.findOne(id);
  }
}
