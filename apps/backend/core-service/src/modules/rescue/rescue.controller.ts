import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { RescueService } from './rescue.service';
import type { CreateRescueDto } from './DTO/rescue.DTO';

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
  @ApiOperation({ summary: 'Get all rescues, optionally filter by status' })
  findAll(@Query('status') status?: string) {
    return this.rescueService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rescue by ID' })
  findOne(@Param('id') id: string) {
    return this.rescueService.findOne(id);
  }
}
