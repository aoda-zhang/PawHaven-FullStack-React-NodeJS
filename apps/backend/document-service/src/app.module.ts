import { join } from 'path';

import { Module } from '@nestjs/common';
import { FileModule } from '@modules/File/file.module.js';
import {
  collectServiceConfigSources,
  SharedModule,
  SharedModuleFeatures,
} from '@pawhaven/backend-core';
import { EmailModule } from '@modules/Email/email.module.js';
import { microServiceNames } from '@pawhaven/backend-core/constants';
// import { PDFModule } from '@modules/Pdf/pdf.module.js';

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
      modules: [
        {
          module: SharedModuleFeatures.SwaggerModule,
        },
      ],
    }),
    EmailModule,
    // PDFModule,
    FileModule,
  ],
  providers: [],
})
export class AppModule {}
