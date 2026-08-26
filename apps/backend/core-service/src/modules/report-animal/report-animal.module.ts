import { Module } from '@nestjs/common';

import { ReportAnimalController } from './report-animal.controller';
import { ReportAnimalService } from './report-animal.service';

@Module({
  controllers: [ReportAnimalController],
  providers: [ReportAnimalService],
  exports: [ReportAnimalService],
})
export class ReportAnimalModule {}
