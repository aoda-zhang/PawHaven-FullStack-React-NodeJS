import { resolve } from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const root = process.cwd();

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: [
      {
        find: /^@prismaClient\//,
        replacement: `${resolve(root, 'src/prisma/mongodb/client')}/`,
      },
      {
        find: /^@modules\//,
        replacement: `${resolve(root, 'src/modules')}/`,
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
