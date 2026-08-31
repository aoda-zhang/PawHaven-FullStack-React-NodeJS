import { Module } from '@nestjs/common';

import { AdoptionModule } from '../adoption/adoption.module';
import { RescueModule } from '../rescue/rescue.module';

import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [RescueModule, AdoptionModule],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
