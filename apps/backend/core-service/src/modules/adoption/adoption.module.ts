import { Module } from '@nestjs/common';

import { AdoptionController } from './adoption.controller.js';
import { AdoptionService } from './adoption.service.js';

@Module({
  controllers: [AdoptionController],
  providers: [AdoptionService],
  exports: [AdoptionService],
})
export class AdoptionModule {}
