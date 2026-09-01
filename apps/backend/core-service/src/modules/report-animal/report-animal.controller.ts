import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AnimalReportDto } from '@pawhaven/shared/types';

import { ReportAnimalService } from './report-animal.service';
import { CreateReportAnimalDto } from './DTO/report-animal.DTO';

@ApiTags('report-animal')
@Controller('report-animal')
export class ReportAnimalController {
  constructor(private readonly reportAnimalService: ReportAnimalService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an animal report' })
  create(@Body() dto: CreateReportAnimalDto, @Req() req: Request) {
    return this.reportAnimalService.create(
      dto as unknown as AnimalReportDto,
      req.headers,
    );
  }
}
