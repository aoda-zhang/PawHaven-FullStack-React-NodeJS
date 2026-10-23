import { NestFactory } from '@nestjs/core';
import { bootstrapApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module.js';

void NestFactory;

bootstrapApp(AppModule).catch(() => {
  process.exitCode = 1;
});
