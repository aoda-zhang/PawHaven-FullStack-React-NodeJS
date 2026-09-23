import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docServiceRoot = join(here, '..');
const repoRoot = join(docServiceRoot, '..', '..', '..');

const designSystemDir = join(repoRoot, 'packages', 'design-system');
const tokensSrcDir = join(designSystemDir, 'src', 'tokens');
const themeSrcFile = join(designSystemDir, 'src', 'theme.css');

const runtimeDir = join(
  docServiceRoot,
  'src',
  'modules',
  'pdf',
  'engine',
  'pdfRunTime',
);
const tokensDestDir = join(runtimeDir, 'tokens');
const themeDestFile = join(runtimeDir, 'theme.css');

mkdirSync(tokensDestDir, { recursive: true });

for (const file of readdirSync(tokensSrcDir)) {
  if (file.endsWith('.css')) {
    cpSync(join(tokensSrcDir, file), join(tokensDestDir, file), {
      force: true,
    });
  }
}

cpSync(themeSrcFile, themeDestFile, { force: true });

console.log(`✓ Copied raw design tokens -> ${runtimeDir} (build input)`);
