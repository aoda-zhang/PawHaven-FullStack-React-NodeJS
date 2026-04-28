import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
} from '@nestjs/common';
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
      'Get all rescues, optionally filter by status. Returns user-relevant rescues if authenticated.',
  })
  findAll(
    @Query('status') status?: string,
    @Headers('x-auth-user-id') userId?: string,
  ) {
    return this.rescueService.findAll(status, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rescue by ID' })
  findOne(@Param('id') id: string) {
    return this.rescueService.findOne(id);
  }
}
