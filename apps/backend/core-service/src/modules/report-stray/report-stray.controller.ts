import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { ReportStrayService } from './report-stray.service';
import { CreateReportStrayDto } from './DTO/report-stray.DTO';

@ApiTags('report-stray')
@Controller('report-stray')
export class ReportStrayController {
  constructor(private readonly reportStrayService: ReportStrayService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a stray animal report' })
  create(@Body() dto: CreateReportStrayDto) {
    return this.reportStrayService.create(dto);
  }
}