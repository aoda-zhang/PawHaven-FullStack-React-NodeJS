import { NestFactory } from '@nestjs/core';
import { bootstrapApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module.js';

bootstrapApp(AppModule, {}, NestFactory).catch(() => {
  process.exitCode = 1;
});
