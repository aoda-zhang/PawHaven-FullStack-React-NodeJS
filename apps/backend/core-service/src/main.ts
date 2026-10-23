import '@nestjs/core';
import { bootstrapApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module.js';

bootstrapApp(AppModule).catch(() => {
  process.exitCode = 1;
});
