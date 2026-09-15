import { join } from 'path';

import { Module } from '@nestjs/common';
import { FileModule } from '@modules/File/file.module.js';
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';
import { EmailModule } from '@modules/Email/email.module.js';
import { microServiceNames } from '@pawhaven/backend-core/constants';
// import { PDFModule } from '@modules/Pdf/pdf.module.js';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: microServiceNames.DOCUMENT,
      configRoot: join(import.meta.dirname, 'config'),
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
