import { join } from 'path';

import { AdoptionModule } from '@modules/adoption/adoption.module.js';
import { AnimalFollowModule } from '@modules/animal-follow/animalFollow.module.js';
import { BootstrapModule } from '@modules/bootstrap/bootstrap.module.js';
import { HomeModule } from '@modules/home/home.module.js';
import { RescueModule } from '@modules/rescue/rescue.module.js';
import { ReportAnimalModule } from '@modules/report-animal/reportAnimal.module.js';
import { Module } from '@nestjs/common';
import {
  collectServiceConfigSources,
  SharedModule,
  SharedModuleFeatures,
} from '@pawhaven/backend-core';
import {
  databaseEngines,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient/index.js';

const configContext = import.meta.webpackContext('./config', {
  recursive: true,
  regExp: /\/env\/index\.json$/,
});

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: microServiceNames.CORE,
      configSources: collectServiceConfigSources(configContext),
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
    BootstrapModule,
    RescueModule,
    ReportAnimalModule,
    AdoptionModule,
    AnimalFollowModule,
  ],
})
export class AppModule {}
