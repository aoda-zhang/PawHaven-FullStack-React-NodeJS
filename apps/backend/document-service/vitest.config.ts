import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const SERVICE_ROOT = import.meta.dirname;

/**
 * Derive the alias map from `tsconfig.json` `compilerOptions.paths` so the test
 * resolver can never drift from the rspack build. Mirrors `buildAliases()` in
 * rspack.config.mjs.
 */
const buildAliases = () => {
  const { paths = {} } = require(
    resolve(SERVICE_ROOT, 'tsconfig.json'),
  ).compilerOptions;

  return Object.entries(paths).map(([alias, [target]]) => ({
    find: new RegExp(`^${alias.replace(/\/\*$/, '')}(/.*)?$`),
    replacement: `${resolve(SERVICE_ROOT, target.replace(/\/\*$/, ''))}$1`,
  }));
};

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: buildAliases(),
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
