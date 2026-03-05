import { join } from 'path';

import { BootstrapModule } from '@modules/bootstrap/bootstrap.module';
import { Module } from '@nestjs/common';
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';
import {
  databaseEngines,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import { PrismaClient as MongoPrismaClient } from '@prisma/client';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(__dirname, '..'),
      serviceName: microServiceNames.CORE,
      modules: [
        {
          module: SharedModuleFeatures.JWTModule,
        },
        {
          module: SharedModuleFeatures.PrismaModule,
          options: {
            databaseEngine: databaseEngines.mongodb,
            Client: MongoPrismaClient,
          },
        },
        {
          module: SharedModuleFeatures.SwaggerModule,
        },
      ],
    }),
    BootstrapModule,
  ],
})
export class AppModule {}
