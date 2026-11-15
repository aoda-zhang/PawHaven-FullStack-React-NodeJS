import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { InternalJwt as InternalJwtClaims } from '@pawhaven/backend-core/types';
import {
  AnimalReportSchema,
  type AnimalReportDto,
} from '@pawhaven/shared/types';

import { ReportAnimalService } from './reportAnimal.service.js';

@ApiTags('report-animal')
@Controller('report-animal')
export class ReportAnimalController {
  constructor(private readonly reportAnimalService: ReportAnimalService) {}

  @OptionalAuth()
  @Post()
  @ApiOperation({ summary: 'Submit an animal report' })
  create(
    @Body({ schema: AnimalReportSchema }) dto: AnimalReportDto,
    @InternalJwt({ allowAnonymous: true }) claims: InternalJwtClaims,
  ) {
    return this.reportAnimalService.create(dto, claims);
  }
}
