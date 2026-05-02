import { join } from 'path';

import { BootstrapModule } from '@modules/bootstrap/bootstrap.module';
import { RescueModule } from '@modules/rescue/rescue.module';
import { ReportStrayModule } from '@modules/report-stray/report-stray.module';
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
    BootstrapModule,
    RescueModule,
    ReportStrayModule,
  ],
})
export class AppModule {}
