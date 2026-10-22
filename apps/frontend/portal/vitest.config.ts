import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    viteTsconfigPaths(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    css: false,
    setupFiles: ['./vitest.setup.ts'],
    // Modules such as the API client read import.meta.env while they are
    // evaluated. Keep the test environment explicit instead of relying on a
    // stub that cannot replace Vite's compiled import.meta.env object.
    env: {
      PAWHAVEN_USER_APP_ENV: 'test',
      PAWHAVEN_USER_API_BASE_URL: 'http://localhost',
      PAWHAVEN_USER_API_PRIVATE_KEY: 'test-key',
      PAWHAVEN_USER_VERSION: '1.0.0',
      PAWHAVEN_USER_SENTRY_DSN: '',
      PAWHAVEN_USER_GA_ID: '',
      PAWHAVEN_USER_SERVICE_URL: '',
      PAWHAVEN_USER_NOTIFICATION_SERVICE_URL: '',
    },
  },
});
