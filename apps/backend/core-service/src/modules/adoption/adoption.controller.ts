import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { AdoptionService } from './adoption.service';

@ApiTags('adoption')
@Controller('adoptable-pets')
export class AdoptionController {
  constructor(private readonly adoptionService: AdoptionService) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Get adoptable pet by ID' })
  findOne(@Param('id') id: string) {
    return this.adoptionService.findOne(id);
  }
}
