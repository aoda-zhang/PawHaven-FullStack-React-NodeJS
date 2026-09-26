import { type Type, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigValidationError } from '@pawhaven/shared/utils';

import { type ConfigureAppOptions, configureApp } from './configureApp.js';

export interface BootstrapAppOptions extends ConfigureAppOptions {
  serviceName?: string;
  listenHost?: string;
  enableTrustProxy?: boolean;
}

const DEFAULT_LISTEN_HOST = '0.0.0.0';
const FALLBACK_SERVICE_NAME = 'service';

export async function bootstrapApp(
  module: Type<unknown>,
  options: BootstrapAppOptions = {},
): Promise<NestExpressApplication> {
  const {
    listenHost = DEFAULT_LISTEN_HOST,
    enableTrustProxy = false,
    ...configureOptions
  } = options;

  const logger = new Logger('Bootstrap');
  let serviceName = options.serviceName ?? FALLBACK_SERVICE_NAME;
  let app: NestExpressApplication;

  try {
    app = await NestFactory.create<NestExpressApplication>(module, {
      bufferLogs: true,
      forceCloseConnections: true,
      bodyParser: false,
    });
  } catch (error) {
    Logger.flush();

    if (error instanceof ConfigValidationError) {
      logger.error(error.message);
    } else {
      logger.error(
        `Failed to initialise ${serviceName}`,
        error instanceof Error ? error.stack : String(error),
      );
      logger.error(
        `${serviceName} refused to start. No HTTP listener was opened.`,
      );
    }
    throw error;
  }

  const configService = app.get(ConfigService);
  serviceName =
    options.serviceName ??
    configService.get<string>('serviceName') ??
    FALLBACK_SERVICE_NAME;

  if (enableTrustProxy) {
    const trustProxy = configService.get<number>('http.trustProxy') ?? 0;
    if (trustProxy > 0) {
      app.set('trust proxy', trustProxy);
    }
  }

  configureApp(app, configureOptions);

  const port = configService.getOrThrow<number>('http.port');

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

  return app;
}
