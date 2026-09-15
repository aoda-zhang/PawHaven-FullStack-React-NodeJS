import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';

import { AdoptionService } from './adoption.service.js';

@ApiTags('adoption')
@Controller('adoptable-pets')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

  @OptionalAuth()
  @Get()
  @ApiOperation({
    summary:
      'Get adoptable pets, optionally filter by adoptionStatus or limit the result count.',
  })
  findAll(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.adoptionService.findAll(
      status,
      limit ? Number(limit) : undefined,
    );
  }

  @OptionalAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get adoptable pet by ID' })
  findOne(@Param('id') id: string) {
    return this.adoptionService.findOne(id);
  }
}
