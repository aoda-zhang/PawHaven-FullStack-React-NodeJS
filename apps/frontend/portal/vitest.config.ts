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
      PAWHAVEN_PORTAL_APP_ENV: 'test',
      PAWHAVEN_PORTAL_API_BASE_URL: 'http://localhost',
      PAWHAVEN_PORTAL_API_PRIVATE_KEY: 'test-key',
      PAWHAVEN_PORTAL_VERSION: '1.0.0',
      PAWHAVEN_PORTAL_SENTRY_DSN: '',
      PAWHAVEN_PORTAL_GA_ID: '',
      PAWHAVEN_PORTAL_SERVICE_URL: '',
      PAWHAVEN_PORTAL_NOTIFICATION_SERVICE_URL: '',
    },
  },
});
