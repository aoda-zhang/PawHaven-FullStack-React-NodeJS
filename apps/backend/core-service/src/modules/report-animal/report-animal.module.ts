import { Module } from '@nestjs/common';

import { ReportAnimalController } from './report-animal.controller.js';
import { ReportAnimalService } from './report-animal.service.js';

@Module({
  controllers: [ReportAnimalController],
  providers: [ReportAnimalService],
  exports: [ReportAnimalService],
})
export class ReportAnimalModule {}
