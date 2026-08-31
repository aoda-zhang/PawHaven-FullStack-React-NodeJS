import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setupApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    forceCloseConnections: true,
    bodyParser: false,
  });

  const configService = app.get(ConfigService) as ConfigService;

  const logger = new Logger('Bootstrap');

  setupApp(app, { enableVersioning: true, enableValidationPipe: true });

  const port = configService.getOrThrow<number>('http.port');

  try {
    await app.listen(port, '0.0.0.0');
    logger.log(`Gateway running at http://localhost:${port}`);
  } catch (error) {
    logger.error('Failed to start Gateway', error);
    throw new Error(
      `Bootstrap failed: ${error instanceof Error ? error.message : error}`,
    );
  }
}

bootstrap();
