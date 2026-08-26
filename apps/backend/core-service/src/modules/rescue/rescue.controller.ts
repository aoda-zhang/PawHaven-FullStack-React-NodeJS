import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { RescueService } from './rescue.service';
import { CreateRescueDto } from './DTO/rescue.DTO';

@ApiTags('rescues')
@Controller('rescues')
export class RescueController {
  constructor(private readonly rescueService: RescueService) {}

  @Post()
  @ApiOperation({ summary: 'Create a rescue record' })
  create(@Body() dto: CreateRescueDto) {
    return this.rescueService.create(dto);
  }

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

  @Get(':id')
  @ApiOperation({ summary: 'Get rescue by ID' })
  findOne(@Param('id') id: string) {
    return this.rescueService.findOne(id);
  }
}
