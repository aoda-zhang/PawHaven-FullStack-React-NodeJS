import { NestFactory } from '@nestjs/core';
import { bootstrapApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module.js';

// Vercel's zero-config NestJS detector scans the entrypoint for @nestjs/core.
// Keep this explicit reference because NestFactory is otherwise only imported
// transitively through the shared bootstrap package.
void NestFactory;

bootstrapApp(AppModule).catch(() => {
  process.exitCode = 1;
});
