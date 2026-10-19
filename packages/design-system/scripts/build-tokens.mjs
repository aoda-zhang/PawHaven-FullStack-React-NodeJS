import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

execFileSync(
  'pnpm',
  [
    'exec',
    'tailwindcss',
    '-i',
    './scripts/build-tokens.css',
    '-o',
    './dist/design-tokens.css',
  ],
  { cwd: packageDir, stdio: 'inherit' },
);
