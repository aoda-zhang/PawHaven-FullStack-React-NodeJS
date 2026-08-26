import { join } from 'path';

import { AdoptionModule } from '@modules/adoption/adoption.module';
import { HomeModule } from '@modules/home/home.module';
import { RescueModule } from '@modules/rescue/rescue.module';
import { ReportAnimalModule } from '@modules/report-animal/report-animal.module';
import { Module } from '@nestjs/common';
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';
import {
  databaseEngines,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(__dirname, '..'),
      serviceName: microServiceNames.CORE,
      modules: [
        {
          module: SharedModuleFeatures.PrismaModule,
          options: {
            databaseEngine: databaseEngines.mongodb,
            Client: PrismaClient,
          },
        },
        {
          module: SharedModuleFeatures.SwaggerModule,
        },
      ],
    }),
    HomeModule,
    RescueModule,
    ReportAnimalModule,
    AdoptionModule,
  ],
})
export class AppModule {}
