#!/usr/bin/env node
// Combined token/style gate for the frontend. Scans apps/frontend and packages/ui for
// styling violations against the design system.
// Exit 0 = clean, 1 = violation, 2 = input error.
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative, resolve } = require('node:path');

const repoRoot = resolve(__dirname, '..', '..', '..');

const TARGETS = ['apps/frontend', 'packages/ui'];
const FILE_TYPES = new Set(['.tsx', '.ts', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage']);

const TOKEN_DIRS = [
  'packages/design-system/src/tokens',
  'packages/design-system/src/theme.css',
];

const VALID_TOKENS = new Set();

function collectFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...collectFiles(full));
    } else {
      const dot = entry.name.lastIndexOf('.');
      if (dot !== -1 && entry.name.slice(dot) === '.css') out.push(full);
    }
  }
  return out;
}

for (const dir of TOKEN_DIRS) {
  const abs = join(repoRoot, dir);
  if (!existsSync(abs)) {
    console.error(`token-check: token source not found: ${dir}`);
    process.exit(2);
  }
  const stat = statSync(abs).isFile();
  const cssFiles = stat ? [abs] : collectFiles(abs);
  for (const file of cssFiles) {
    const css = readFileSync(file, 'utf8');
    const matches = css.match(/--[\w-]+:/g);
    if (matches) {
      for (const m of matches) VALID_TOKENS.add(m.slice(0, -1));
    }
  }
}

const UTILITY_TOKEN_MAP = [
  { prefix: 'bg-', token: '--color-' },
  { prefix: 'text-', token: '--color-' },
  { prefix: 'border-', token: '--color-' },
  { prefix: 'ring-', token: '--color-' },
  { prefix: 'outline-', token: '--color-' },
  { prefix: 'shadow-', token: '--shadow-' },
  { prefix: 'rounded-', token: '--radius-' },
  { prefix: 'p-', token: '--spacing-' },
  { prefix: 'px-', token: '--spacing-' },
  { prefix: 'py-', token: '--spacing-' },
  { prefix: 'pt-', token: '--spacing-' },
  { prefix: 'pr-', token: '--spacing-' },
  { prefix: 'pb-', token: '--spacing-' },
  { prefix: 'pl-', token: '--spacing-' },
  { prefix: 'm-', token: '--spacing-' },
  { prefix: 'mx-', token: '--spacing-' },
  { prefix: 'my-', token: '--spacing-' },
  { prefix: 'mt-', token: '--spacing-' },
  { prefix: 'mr-', token: '--spacing-' },
  { prefix: 'mb-', token: '--spacing-' },
  { prefix: 'ml-', token: '--spacing-' },
  { prefix: 'gap-', token: '--spacing-' },
  { prefix: 'space-x-', token: '--spacing-' },
  { prefix: 'space-y-', token: '--spacing-' },
  { prefix: 'w-', token: '--spacing-' },
  { prefix: 'h-', token: '--spacing-' },
  { prefix: 'min-w-', token: '--spacing-' },
  { prefix: 'min-h-', token: '--spacing-' },
  { prefix: 'max-w-', token: '--spacing-' },
  { prefix: 'max-h-', token: '--spacing-' },
  { prefix: 'font-', token: '--font-' },
  { prefix: 'leading-', token: '--leading-' },
  { prefix: 'tracking-', token: '--tracking-' },
  { prefix: 'z-', token: '--z-index-' },
  { prefix: 'duration-', token: '--duration-' },
  { prefix: 'ease-', token: '--ease-' },
  { prefix: 'opacity-', token: '--opacity-' },
];

const VALID_UTILITIES = new Set([
  'full-width',
  'text-hero',
  'text-stat',
  'flex-center',
  'flex-between',
  'flex-col-center',
  'link',
  'focus-ring',
  'btn-base',
  'btn-primary',
  'btn-secondary',
  'btn-outline',
  'card',
  'input-field',
  'form-error',
  'link-reset',
  'button-reset',
  'button-rounded',
]);

const KNOWN_VIOLATIONS = new Set([
  'apps/frontend/portal/src/features/home/components/AdoptablePetsSection.tsx:25:inline-style',
  'apps/frontend/portal/src/features/home/components/PetCard.tsx:27:inline-style',
  'apps/frontend/portal/src/layout/RootLayoutFooter.tsx:120:palette-name',
  'apps/frontend/portal/src/layout/RootLayoutFooter.tsx:132:palette-name',
  'apps/frontend/portal/src/layout/RootLayoutFooter.tsx:143:palette-name',
  'apps/frontend/portal/src/features/home/components/PetCard.tsx:40:palette-name',
  'packages/ui/src/components/button/Button.tsx:9:px-arbitrary',
]);

const STYLE_RULES = [
  {
    id: 'raw-hex',
    pattern: /#[0-9a-fA-F]{3,8}/,
    message: 'raw hex color — use a design token',
    fileTypes: ['.tsx', '.ts', '.css'],
  },
  {
    id: 'palette-name',
    pattern:
      /(text|bg|border)-(red|blue|green|yellow|orange|gray|brown)-[0-9]+/,
    message: 'raw Tailwind palette name — use a semantic token',
    fileTypes: ['.tsx'],
  },
  {
    id: 'var-bypass',
    pattern:
      /(bg|text|border|ring|outline|shadow|accent|caret|fill|stroke|placeholder|decoration)-\[var\(--color-/,
    message:
      'CSS-variable bypass — use the design token utility class directly',
    fileTypes: ['.tsx'],
  },
  {
    id: 'inline-style',
    pattern: /style=\{\{[^}]*:\s*(['"]|\d+\s*[,}])[^}]*\}\}/,
    message:
      'inline style={{}} with a static value — use a utility class or design token',
    fileTypes: ['.tsx'],
  },
  {
    id: 'px-arbitrary',
    pattern: /-\[[0-9]*\.?[0-9]+px\]/,
    message: 'px in an arbitrary value — use a design token or rem',
    fileTypes: ['.tsx', '.ts', '.css'],
  },
];

function extractClassNames(text) {
  const names = [];
  const classRegex = /className\s*=\s*[{"'`]([^}"'`]+)[}"'`]/g;
  let match;
  while ((match = classRegex.exec(text)) !== null) {
    const raw = match[1];
    for (const token of raw.split(/[\s'"]+/)) {
      if (token.startsWith('${') || token.includes('?') || token.includes(':'))
        continue;
      names.push(token);
    }
  }
  return names;
}

function tokenExists(className) {
  if (VALID_UTILITIES.has(className)) return true;
  const parts = className.split('-');
  if (parts.length < 2) return false;
  const prefix = parts[0] + '-';
  const mapEntry = UTILITY_TOKEN_MAP.find((e) => e.prefix === prefix);
  if (!mapEntry) return false;
  const tokenName = mapEntry.token + parts.slice(1).join('-');
  return VALID_TOKENS.has(tokenName);
}

const failures = [];
let filesScanned = 0;

for (const target of TARGETS) {
  const dir = join(repoRoot, target);
  if (!existsSync(dir)) {
    console.error(`token-check: target directory not found: ${target}`);
    process.exit(2);
  }
  for (const file of collectFiles(dir)) {
    filesScanned++;
    const rel = relative(repoRoot, file);
    const ext = file.slice(file.lastIndexOf('.'));
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((text, index) => {
      for (const rule of STYLE_RULES) {
        if (!rule.fileTypes.includes(ext)) continue;
        if (!rule.pattern.test(text)) continue;
        const key = `${rel}:${index + 1}:${rule.id}`;
        if (KNOWN_VIOLATIONS.has(key)) continue;
        failures.push(`${key}: ${rule.message} — ${text.trim()}`);
      }
      if (ext !== '.tsx' && ext !== '.ts') return;
      for (const className of extractClassNames(text)) {
        if (!tokenExists(className)) {
          const key = `${rel}:${index + 1}:unknown-classname`;
          if (KNOWN_VIOLATIONS.has(key)) continue;
          failures.push(
            `${key}: unknown classname "${className}" — no matching design token`,
          );
        }
      }
    });
  }
}

console.log(
  `token-check: ${filesScanned} files scanned, ${VALID_TOKENS.size} tokens loaded`,
);

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail  ${failure}`);
  process.exit(1);
}

console.log('token-check: OK');
