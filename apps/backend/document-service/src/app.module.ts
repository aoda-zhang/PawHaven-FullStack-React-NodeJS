import { Module } from '@nestjs/common';
import { FileModule } from '@modules/File/file.module';
import {
  microServiceNames,
  SharedModule,
  SharedModuleFeatures,
} from '@pawhaven/backend-core';
import { EmailModule } from '@modules/Email/email.module';
import { PDFModule } from '@modules/Pdf/pdf.module';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceName: microServiceNames.DOCUMENT,
      modules: [
        {
          module: SharedModuleFeatures.SwaggerModule,
        },
      ],
    }),
    EmailModule,
    PDFModule,
    FileModule,
  ],
  providers: [],
})
export class AppModule {}
