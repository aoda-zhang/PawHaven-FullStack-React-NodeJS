import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import {
  CreateRescueDtoSchema,
  type CreateRescueDto,
} from '@pawhaven/shared/types';

import { RescueService } from './rescue.service.js';

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
  @Get(':id')
  @ApiOperation({ summary: 'Get rescue by ID' })
  findOne(@Param('id') id: string) {
    return this.rescueService.findOne(id);
  }
}
