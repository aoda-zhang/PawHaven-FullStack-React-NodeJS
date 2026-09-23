import { Module } from '@nestjs/common';

import { AnimalFollowController } from './animalFollow.controller.js';
import { AnimalFollowService } from './animalFollow.service.js';

@Module({
  controllers: [AnimalFollowController],
  providers: [AnimalFollowService],
  exports: [AnimalFollowService],
})
export class AnimalFollowModule {}
