import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SwaggerModule as NestSwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  constructor(private readonly config: ConfigService) {}

  init(app: NestExpressApplication) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) return;

    const options = new DocumentBuilder()
      .setTitle(this.config.get<string>('swagger.title') ?? '')
      .setDescription(this.config.get<string>('swagger.description') ?? '')
      .setVersion(this.config.get<string>('swagger.version') ?? '')
      .addBearerAuth()
      .build();

    const document = NestSwaggerModule.createDocument(app, options);
    NestSwaggerModule.setup(
      this.config.get('swagger.prefix') ?? 'api-docs',
      app,
      document,
    );
  }
}
