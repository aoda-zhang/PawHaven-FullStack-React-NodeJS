import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import {
  AnimalReportSchema,
  type AnimalReportDto,
} from '@pawhaven/shared/types';

import { ReportAnimalService } from './report-animal.service.js';

@ApiTags('report-animal')
@Controller('report-animal')
export class ReportAnimalController {
  constructor(private readonly reportAnimalService: ReportAnimalService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an animal report' })
  create(
    @Body({ schema: AnimalReportSchema }) dto: AnimalReportDto,
    @InternalJwt() claims: AuthenticatedInternalJwt,
  ) {
    return this.reportAnimalService.create(dto, claims);
  }
}
