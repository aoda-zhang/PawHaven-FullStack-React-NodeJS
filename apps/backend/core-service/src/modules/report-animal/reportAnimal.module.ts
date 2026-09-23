import { Module } from '@nestjs/common';

import { ReportAnimalController } from './reportAnimal.controller.js';
import { ReportAnimalService } from './reportAnimal.service.js';

@Module({
  controllers: [ReportAnimalController],
  providers: [ReportAnimalService],
  exports: [ReportAnimalService],
})
export class ReportAnimalModule {}
