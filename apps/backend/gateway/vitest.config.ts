import { resolve } from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const backendCoreRoot = resolve(
  process.cwd(),
  '../../../packages/backend-core',
);

const sharedRoot = resolve(process.cwd(), '../../../packages/shared');

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: [
      {
        find: /^@pawhaven\/backend-core$/,
        replacement: resolve(backendCoreRoot, 'index.ts'),
      },
      {
        find: /^@pawhaven\/backend-core\/internal-jwt$/,
        replacement: resolve(backendCoreRoot, 'modules/internal-jwt/index.ts'),
      },
      {
        find: /^@pawhaven\/backend-core\/constants$/,
        replacement: resolve(backendCoreRoot, 'common/constants/index.ts'),
      },
      {
        find: /^@pawhaven\/backend-core\/decorators$/,
        replacement: resolve(backendCoreRoot, 'common/decorators/index.ts'),
      },
      {
        find: /^@pawhaven\/backend-core\/middlewares$/,
        replacement: resolve(
          backendCoreRoot,
          'infrastructure/middleware/index.ts',
        ),
      },
      {
        find: /^@pawhaven\/backend-core\/setup$/,
        replacement: resolve(
          backendCoreRoot,
          'infrastructure/bootstrap/index.ts',
        ),
      },
      {
        find: /^@pawhaven\/backend-core\/types$/,
        replacement: resolve(backendCoreRoot, 'common/types/index.ts'),
      },
      {
        find: /^@pawhaven\/backend-core\/utils$/,
        replacement: resolve(backendCoreRoot, 'common/utils/index.ts'),
      },
      {
        find: /^@pawhaven\/shared\/types$/,
        replacement: resolve(sharedRoot, 'types/index.ts'),
      },
      {
        find: /^@pawhaven\/shared\/utils$/,
        replacement: resolve(sharedRoot, 'utils/index.ts'),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
