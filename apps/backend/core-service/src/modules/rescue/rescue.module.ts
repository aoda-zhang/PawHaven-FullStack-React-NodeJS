import { Module } from '@nestjs/common';

import { RescueController } from './rescue.controller.js';
import { RescueService } from './rescue.service.js';

@Module({
  controllers: [RescueController],
  providers: [RescueService],
  exports: [RescueService],
})
export class RescueModule {}
