import { join } from 'path';

import { Module } from '@nestjs/common';
import { FileModule } from '@modules/File/file.module';
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';
import { EmailModule } from '@modules/Email/email.module';
import { microServiceNames } from '@pawhaven/backend-core/constants';
// import { PDFModule } from '@modules/Pdf/pdf.module';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(__dirname, '..'),
      serviceName: microServiceNames.DOCUMENT,
      modules: [
        {
          module: SharedModuleFeatures.JWTModule,
        },
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
