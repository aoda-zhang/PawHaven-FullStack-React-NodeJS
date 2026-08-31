import type { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { setupApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const configService = app.get(ConfigService) as ConfigService;

  setupApp(app);

  const port = configService.getOrThrow<number>('http.port');

  try {
    await app.listen(port, '0.0.0.0');
    logger.log(`document-service running at http://localhost:${port}`);
  } catch (error) {
    logger.error('Failed to start document-service', error);
    throw new Error(
      `Bootstrap failed: ${error instanceof Error ? error.message : error}`,
    );
  }
}

bootstrap();
