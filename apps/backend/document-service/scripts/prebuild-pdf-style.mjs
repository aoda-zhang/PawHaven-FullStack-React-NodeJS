/**
 * document-service prebuild.
 *
 * 1. Syncs @pawhaven/design-system tokens into document-service
 *    (builds them, then copies into src/modules/pdf/engine as a build input).
 * 2. Compiles the PDF stylesheet: index.css -> pdf.generated.css via the Tailwind CLI.
 *
 * Running this as a single node script keeps the flow self-contained and avoids
 * relying on the `tailwindcss` binary being on PATH.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const docServiceRoot = join(here, '..');

const syncScript = join(here, 'sync-design-tokens.mjs');
const tailwindBin = join(docServiceRoot, 'node_modules', '.bin', 'tailwindcss');
const pdfCss = join(
  docServiceRoot,
  'src',
  'modules',
  'pdf',
  'engine',
  'index.css',
);
const pdfGeneratedCss = join(
  docServiceRoot,
  'src',
  'modules',
  'pdf',
  'engine',
  'pdfRunTime',
  'pdf.generated.css',
);

console.log('› Syncing design tokens...');
execFileSync(process.execPath, [syncScript], {
  cwd: docServiceRoot,
  stdio: 'inherit',
});

// Copy the simplified-Chinese font out of @fontsource so it is a project asset
// (not a node_modules import). rspack externalizes node_modules assets, which
// would leave an unresolved runtime require; a project asset is inlined as a
// data URL, letting headless Chromium render Chinese glyphs.
console.log('› Copying CJK font (Noto Sans SC) from @fontsource...');
const cjkFontSrc = join(
  docServiceRoot,
  'node_modules',
  '@fontsource',
  'noto-sans-sc',
  'files',
  'noto-sans-sc-chinese-simplified-400-normal.woff2',
);
if (!existsSync(cjkFontSrc)) {
  throw new Error(
    `CJK font not found at ${cjkFontSrc} (is @fontsource/noto-sans-sc installed?)`,
  );
}
const cjkFontDestDir = join(docServiceRoot, 'src', 'assets', 'fonts');
mkdirSync(cjkFontDestDir, { recursive: true });
copyFileSync(
  cjkFontSrc,
  join(cjkFontDestDir, 'noto-sans-sc-chinese-simplified-400-normal.woff2'),
);

if (!existsSync(tailwindBin)) {
  throw new Error(`Tailwind CLI not found at ${tailwindBin}`);
}

console.log('› Compiling PDF stylesheet...');
// The bin is a shell shim (not a .js file), so it must be executed directly,
// not passed to node.
execFileSync(tailwindBin, ['-i', pdfCss, '-o', pdfGeneratedCss], {
  cwd: docServiceRoot,
  stdio: 'inherit',
});

console.log('✓ prebuild complete');
