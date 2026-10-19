import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serviceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(
  serviceRoot,
  'src',
  'modules',
  'pdf',
  'engine',
  'pdfRunTime',
  'pdf.generated.css',
);

const css = readFileSync(cssPath, 'utf8');
if (statSync(cssPath).size === 0) {
  throw new Error('Generated PDF stylesheet is empty.');
}

const requiredFragments = [
  ['semantic typography utility', '.text-body'],
  ['primitive color utility used by PDF templates', '.text-gray-6'],
  ['primitive border utility used by PDF templates', '.border-brown-3'],
  ['resolved color token', '--color-gray-6'],
];

const missing = requiredFragments
  .filter(([, fragment]) => !css.includes(fragment))
  .map(([label, fragment]) => `${label}: ${fragment}`);

if (missing.length > 0) {
  throw new Error(
    `PDF design-token stylesheet verification failed:\\n- ${missing.join('\\n- ')}`,
  );
}

if (css.includes("@import './pdfRunTime/") || css.includes('@source ')) {
  throw new Error('Generated PDF stylesheet still contains unprocessed Tailwind directives.');
}

console.log(
  `PDF stylesheet verified: ${requiredFragments.length} token/utility assertions passed (${css.length} bytes).`,
);
