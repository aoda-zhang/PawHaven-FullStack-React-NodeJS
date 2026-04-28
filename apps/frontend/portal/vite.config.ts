import path from 'path';

import ViteYaml from '@modyfi/vite-plugin-yaml';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  envPrefix: 'PAWHAVEN_USER_',
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    strictPort: false,
    open: true,
    proxy: {
      '/api': {
        // target: 'http://localhost:8080',
        target: 'https://pawhaven.work',
        changeOrigin: true,
        // rewrite: (url) => url.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false, // ⭐ allow auto port fallback
  },
  build: {
    outDir: 'build',
  },
  plugins: [
    tsconfigPaths(),
    react({
      // Enable react19 features
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    ViteYaml(),
    tailwindcss(),
  ],
  css: {
    modules: {
      // This is the default value, but you can customize it if needed
      generateScopedName: '[local]__[hash:base64:5]',
    },
  },
});
