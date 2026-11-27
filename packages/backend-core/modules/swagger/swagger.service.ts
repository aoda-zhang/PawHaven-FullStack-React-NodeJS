import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isProd } from '@pawhaven/shared/utils';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  SwaggerModule as NestSwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

@Injectable()
export class SwaggerService {
  constructor(private readonly config: ConfigService) {}

  init(app: NestExpressApplication) {
    // `http.env` is the resolved bundle value ('prod' | 'uat'), not the raw NODE_ENV alias.
    if (isProd(this.config.get<string>('http.env'))) return;

    const options = new DocumentBuilder()
      .setTitle(this.config.getOrThrow<string>('swagger.title'))
      .setDescription(this.config.get<string>('swagger.description') ?? '')
      .setVersion(this.config.getOrThrow<string>('swagger.version'))
      .addBearerAuth()
      .build();

    const document = NestSwaggerModule.createDocument(app, options);
    NestSwaggerModule.setup(
      this.config.getOrThrow('swagger.prefix'),
      app,
      document,
    );
  }
}
