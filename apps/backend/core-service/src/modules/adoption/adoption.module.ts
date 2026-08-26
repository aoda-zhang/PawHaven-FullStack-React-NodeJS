import { Module } from '@nestjs/common';

import { AdoptionController } from './adoption.controller';
import { AdoptionService } from './adoption.service';

@Module({
  controllers: [AdoptionController],
  providers: [AdoptionService],
  exports: [AdoptionService],
})
export class AdoptionModule {}
