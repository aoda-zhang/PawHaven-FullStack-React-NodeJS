import { VersioningType } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';

import { httpHeaders } from '../constants/httpHeaders.js';
import { traceMiddleware } from '../trace/trace.middleware.js';

const toHeaderList = (value: string | string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  return (Array.isArray(value) ? value : value.split(','))
    .map((header) => header.trim())
    .filter(Boolean);
};

export interface ConfigureAppOptions {
  enableVersioning?: boolean;
  enableCors?: boolean;
  enableCookieParser?: boolean;
  enableHelmet?: boolean;
  enableBodyParser?: boolean;
  enableShutdownHooks?: boolean;
  enableTrace?: boolean;
}

/**
 * The app MUST be created with `bodyParser: false`, otherwise Nest registers
 * its own unlimited parser first and `http.maxJsonBodySize` is silently
 * bypassed.
 */
export function configureApp(
  app: NestExpressApplication,
  options: ConfigureAppOptions = {},
): void {
  const {
    enableVersioning = false,
    enableCors = true,
    enableCookieParser = true,
    enableHelmet = true,
    enableBodyParser = true,
    enableShutdownHooks = true,
    enableTrace = true,
  } = options;

  const configService = app.get(ConfigService);

  // First, so a request rejected by the body parser or by any later stage still
  // carries a trace id on the response and in the logs.
  if (enableTrace) {
    app.use(traceMiddleware);
  }

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
    const corsOptions = configService.getOrThrow<CorsOptions>('cors');
    const allowedHeaders = Array.from(
      new Set([
        ...toHeaderList(corsOptions.allowedHeaders),
        httpHeaders.traceId,
      ]),
    );
    const exposedHeaders = Array.from(
      new Set([
        ...toHeaderList(corsOptions.exposedHeaders),
        httpHeaders.traceId,
      ]),
    );
    app.enableCors({ ...corsOptions, allowedHeaders, exposedHeaders });
  }

  if (enableCookieParser) {
    app.use(cookieParser());
  }

  app.setGlobalPrefix(httpPrefix);

  if (enableVersioning) {
    app.enableVersioning({ type: VersioningType.URI });
  }
}
