import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(packageDir, 'dist'), { recursive: true });

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
