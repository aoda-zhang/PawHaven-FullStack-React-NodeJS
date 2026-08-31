import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';

export interface SetupAppOptions {
  enableVersioning?: boolean;
  enableCors?: boolean;
  enableCookieParser?: boolean;
  enableHelmet?: boolean;
  enableValidationPipe?: boolean;
  enableBodyParser?: boolean;
  enableShutdownHooks?: boolean;
}

/**
 * The app MUST be created with `bodyParser: false`, otherwise Nest registers
 * its own unlimited parser first and `http.maxJsonBodySize` is silently
 * bypassed.
 */
export function setupApp(
  app: NestExpressApplication,
  options: SetupAppOptions = {},
): void {
  const {
    enableVersioning = false,
    enableCors = true,
    enableCookieParser = true,
    enableHelmet = true,
    enableValidationPipe = false,
    enableBodyParser = true,
    enableShutdownHooks = true,
  } = options;

  const configService = app.get(ConfigService);

  if (enableBodyParser) {
    const jsonBodyLimit = configService.getOrThrow<string>(
      'http.maxJsonBodySize',
    );
    app.use(express.json({ limit: jsonBodyLimit }));
    app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));
  }

  const httpPrefix = configService.getOrThrow<string>('http.prefix');

  app.disable('x-powered-by');

  if (enableHelmet) {
    app.use(
      helmet({
        frameguard: { action: 'deny' },
        crossOriginEmbedderPolicy: false,
      }),
    );
  }

  if (enableShutdownHooks) {
    app.enableShutdownHooks();
  }

  if (enableCors) {
    app.enableCors(configService.get('cors'));
  }

  if (enableCookieParser) {
    app.use(cookieParser());
  }

  app.setGlobalPrefix(httpPrefix);

  if (enableVersioning) {
    app.enableVersioning({ type: VersioningType.URI });
  }

  if (enableValidationPipe) {
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        exceptionFactory: (
          errors: ValidationError[],
        ): BadRequestException | ValidationError[] => {
          if (process.env.NODE_ENV === 'production') {
            return new BadRequestException('Validation failed');
          }
          return errors;
        },
      }),
    );
  }
}
