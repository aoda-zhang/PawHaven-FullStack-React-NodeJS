import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// esbuild (vitest's default transformer) does not emit `design:paramtypes`, so
// NestJS cannot resolve constructor dependencies in tests. SWC does, which is
// what makes `Test.createTestingModule` usable here.
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
