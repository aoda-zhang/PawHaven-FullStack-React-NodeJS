import { type Type, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigValidationError } from '@pawhaven/shared/utils';

import { TraceLogger } from '../observability/logging/traceLogger.js';

import { type ConfigureAppOptions, configureApp } from './configureApp.js';

export interface BootstrapAppOptions extends ConfigureAppOptions {
  serviceName?: string;
  listenHost?: string;
  enableTrustProxy?: boolean;
}

const DEFAULT_LISTEN_HOST = '0.0.0.0';
const FALLBACK_SERVICE_NAME = 'service';

async function createNestApplication(
  module: Type<unknown>,
  nestFactory: typeof NestFactory,
  serviceName: string,
  logger: Logger,
): Promise<NestExpressApplication> {
  try {
    return await nestFactory.create<NestExpressApplication>(module, {
      bufferLogs: true,
      forceCloseConnections: true,
      bodyParser: false,
      logger: new TraceLogger(),
    });
  } catch (error) {
    Logger.flush();

    if (error instanceof ConfigValidationError) {
      logger.error(error.message);
      throw error;
    }

    logger.error(
      `Failed to initialise ${serviceName}`,
      error instanceof Error ? error.stack : String(error),
    );
    logger.error(
      `${serviceName} refused to start. No HTTP listener was opened.`,
    );
    throw error;
  }
}

function resolveServiceName(
  configService: ConfigService,
  options: BootstrapAppOptions,
): string {
  return (
    options.serviceName ??
    configService.get<string>('serviceName') ??
    FALLBACK_SERVICE_NAME
  );
}

function applyTrustProxy(
  app: NestExpressApplication,
  configService: ConfigService,
  enableTrustProxy: boolean,
): void {
  if (!enableTrustProxy) {
    return;
  }

  const trustProxy = configService.get<number>('http.trustProxy') ?? 0;
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }
}

async function listenAndLog(
  app: NestExpressApplication,
  logger: Logger,
  serviceName: string,
  port: number,
  listenHost: string,
): Promise<void> {
  try {
    await app.listen(port, listenHost);
    logger.log(`${serviceName} running at http://localhost:${port}`);
  } catch (error) {
    logger.error(
      `Failed to start ${serviceName}`,
      error instanceof Error ? error.stack : String(error),
    );
    throw error;
  }
}

export async function bootstrapApp(
  module: Type<unknown>,
  options: BootstrapAppOptions = {},
  nestFactory: typeof NestFactory = NestFactory,
): Promise<NestExpressApplication> {
  const {
    listenHost = DEFAULT_LISTEN_HOST,
    enableTrustProxy = false,
    ...configureOptions
  } = options;

  const logger = new Logger('Bootstrap');
  const app = await createNestApplication(
    module,
    nestFactory,
    options.serviceName ?? FALLBACK_SERVICE_NAME,
    logger,
  );

  const configService = app.get(ConfigService);
  const serviceName = resolveServiceName(configService, options);

  applyTrustProxy(app, configService, enableTrustProxy);

  configureApp(app, configureOptions);

  const port = configService.getOrThrow<number>('http.port');
  await listenAndLog(app, logger, serviceName, port, listenHost);

  return app;
}
