import { Module } from '@nestjs/common';

import { AdoptionModule } from '../adoption/adoption.module.js';
import { RescueModule } from '../rescue/rescue.module.js';

import { HomeController } from './home.controller.js';
import { HomeService } from './home.service.js';

@Module({
  imports: [RescueModule, AdoptionModule],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
