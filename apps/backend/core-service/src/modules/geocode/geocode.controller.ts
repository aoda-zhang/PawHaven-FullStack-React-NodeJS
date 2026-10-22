import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';

import { GeocodeService } from './geocode.service.js';

@ApiTags('geocode')
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodeService: GeocodeService) {}

  @OptionalAuth()
  @Get('reverse')
  @ApiOperation({ summary: 'Resolve coordinates to a human-readable address' })
  reverse(@Query() query: Record<string, string>) {
    return this.geocodeService.reverse(query);
  }
}
