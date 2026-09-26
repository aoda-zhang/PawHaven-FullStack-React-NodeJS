import { join } from 'path';

import { Module } from '@nestjs/common';
import {
  collectServiceConfigSources,
  SharedModule,
  SharedModuleFeatures,
} from '@pawhaven/backend-core';
import { EmailModule } from '@Email/email.module.js';
import { PDFModule } from '@PDF/pdf.module.js';
import { microServiceNames } from '@pawhaven/backend-core/constants';

import { documentServiceConfigSchema } from './config/Config.schema.js';

const configContext = import.meta.webpackContext('./config', {
  recursive: true,
  regExp: /\/env\/index\.json$/,
});

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: microServiceNames.DOCUMENT,
      configSources: collectServiceConfigSources(configContext),
      configSchema: documentServiceConfigSchema,
      modules: [
        {
          module: SharedModuleFeatures.SwaggerModule,
        },
      ],
    }),
    EmailModule,
    PDFModule,
  ],
  providers: [],
})
export class AppModule {}
