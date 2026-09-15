import { join } from 'path';

import { AuthModule } from '@modules/Auth/auth.module.js';
import { Module } from '@nestjs/common';
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';
import {
  databaseEngines,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import { PrismaClient } from '@prismaClient/index.js';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: microServiceNames.AUTH,
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
    AuthModule,
  ],
})
export class AppModule {}
