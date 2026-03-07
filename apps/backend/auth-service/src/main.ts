import type { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService) as ConfigService;
  app.use(cookieParser());
  app.setGlobalPrefix(configService.get('http.prefix')!);
  const port = configService.get('http.port');

  try {
    await app.listen(port, '0.0.0.0');
    logger.log(`core-service running at http://localhost:${port}`);
  } catch (error) {
    logger.error('Failed to start auth-service', error);
    throw new Error(
      `Bootstrap failed: ${error instanceof Error ? error.message : error}`,
    );
  }
}

bootstrap();
