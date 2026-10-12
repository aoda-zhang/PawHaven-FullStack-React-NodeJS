import { Module } from '@nestjs/common';

import { GuideController } from './guide.controller.js';
import { GuideService } from './guide.service.js';

@Module({
  controllers: [GuideController],
  providers: [GuideService],
  exports: [GuideService],
})
export class GuideModule {}
