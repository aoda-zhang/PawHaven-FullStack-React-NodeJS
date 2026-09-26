import { bootstrapApp } from '@pawhaven/backend-core/setup';

import { AppModule } from './app.module.js';

// bootstrapApp already logs the failure; setting exitCode (rather than calling
// process.exit) lets the buffered Nest logger flush before the process ends.
bootstrapApp(AppModule).catch(() => {
  process.exitCode = 1;
});
