import { VersioningType } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import * as express from 'express';

import { httpHeaders } from '../../common/constants/httpHeaders.js';
import { traceMiddleware } from '../observability/tracing/trace.middleware.js';

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
  enableSecurityHeaders?: boolean;
  enableBodyParser?: boolean;
  enableShutdownHooks?: boolean;
  enableTrace?: boolean;
}

function resolveConfigureOptions(
  options: ConfigureAppOptions,
): Required<ConfigureAppOptions> {
  const {
    enableVersioning = false,
    enableCors = true,
    enableCookieParser = true,
    enableSecurityHeaders = true,
    enableBodyParser = true,
    enableShutdownHooks = true,
    enableTrace = true,
  } = options;

  return {
    enableVersioning,
    enableCors,
    enableCookieParser,
    enableSecurityHeaders,
    enableBodyParser,
    enableShutdownHooks,
    enableTrace,
  };
}

function configureBodyParser(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  const jsonBodyLimit = configService.getOrThrow<string>(
    'http.maxJsonBodySize',
  );
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));
}

/**
 * Built into Nest (>= 12.1) since `@nestjs/core` no longer needs the
 * third-party `helmet` package for this. Defaults match helmet 8; we only
 * tighten `X-Frame-Options` to `deny`.
 */
function configureSecurityHeaders(
  app: NestExpressApplication,
  enableSecurityHeaders: boolean,
): void {
  if (!enableSecurityHeaders) {
    return;
  }

  app.useSecurityHeaders({
    xFrameOptions: { action: 'deny' },
    crossOriginEmbedderPolicy: false,
  });
}

function configureCors(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  const corsOptions = configService.getOrThrow<CorsOptions>('cors');
  const allowedHeaders = Array.from(
    new Set([...toHeaderList(corsOptions.allowedHeaders), httpHeaders.traceId]),
  );
  const exposedHeaders = Array.from(
    new Set([...toHeaderList(corsOptions.exposedHeaders), httpHeaders.traceId]),
  );
  app.enableCors({ ...corsOptions, allowedHeaders, exposedHeaders });
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
  const config = resolveConfigureOptions(options);

  const configService = app.get(ConfigService);

  // First, so a request rejected by the body parser or by any later stage still
  // carries a trace id on the response and in the logs.
  if (config.enableTrace) {
    app.use(traceMiddleware);
  }

  if (config.enableBodyParser) {
    configureBodyParser(app, configService);
  }

  const httpPrefix = configService.getOrThrow<string>('http.prefix');

  app.disable('x-powered-by');

  configureSecurityHeaders(app, config.enableSecurityHeaders);

  if (config.enableShutdownHooks) {
    app.enableShutdownHooks();
  }

  if (config.enableCors) {
    configureCors(app, configService);
  }

  if (config.enableCookieParser) {
    app.use(cookieParser());
  }

  app.setGlobalPrefix(httpPrefix);

  if (config.enableVersioning) {
    app.enableVersioning({ type: VersioningType.URI });
  }
}
