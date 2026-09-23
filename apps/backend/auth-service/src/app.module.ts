import { join } from 'path';

import { AuthModule } from '@modules/auth/auth.module.js';
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
      serviceName: microServiceNames.AUTH,
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
    AuthModule,
  ],
})
export class AppModule {}
