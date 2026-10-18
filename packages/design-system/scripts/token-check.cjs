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
      if (dot !== -1 && FILE_TYPES.has(entry.name.slice(dot))) out.push(full);
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
  // Legacy token aliases (temporary, until codebase migration)
  'text-text-secondary',
  'text-text-inverse',
  'text-text',
  'border-border',
  'text-text-link',
  // Standard Tailwind colors not in design tokens
  'text-white',
  'text-black',
  // Gradient utilities
  'bg-gradient-to-t',
  'bg-gradient-to-tr',
  'bg-gradient-to-r',
  'bg-gradient-to-br',
  'bg-gradient-to-b',
  'bg-gradient-to-bl',
  'bg-gradient-to-l',
  'bg-gradient-to-tl',
  'bg-linear-to-t',
  'bg-linear-to-tr',
  'bg-linear-to-r',
  'bg-linear-to-br',
  'bg-linear-to-b',
  'bg-linear-to-bl',
  'bg-linear-to-l',
  'bg-linear-to-tl',
  // Standard Tailwind colors not in design tokens
  'white',
  'black',
  'transparent',
  'current',
  'inherit',
  // Arbitrary value patterns (handled by tokenExists)
  'z-[100]',
  'gap-x-1',
  'gap-y-0',
]);

const KNOWN_VIOLATIONS = new Set([
  'apps/frontend/portal/src/pages/home/components/AdoptablePetsSection.tsx:25:inline-style',
  'apps/frontend/portal/src/pages/home/components/PetCard.tsx:37:inline-style',
  'apps/frontend/portal/src/app/layout/RootLayoutFooter.tsx:123:palette-name',
  'apps/frontend/portal/src/app/layout/RootLayoutFooter.tsx:135:palette-name',
  'apps/frontend/portal/src/app/layout/RootLayoutFooter.tsx:146:palette-name',
  'apps/frontend/portal/src/pages/home/components/PetCard.tsx:50:palette-name',
  'packages/ui/src/components/button/Button.tsx:9:px-arbitrary',
  'apps/frontend/portal/src/pages/home/components/PetCard.tsx:46:unknown-classname',
  'apps/frontend/portal/src/pages/home/components/PetCard.tsx:50:unknown-classname',
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

// Standard Tailwind utility suffixes that are always allowed
const STANDARD_TAILWIND_SUFFIXES = new Set([
  'auto',
  'full',
  'screen',
  'min',
  'max',
  'fit',
  'px',
  '0',
  '0.5',
  '1',
  '1.5',
  '2',
  '2.5',
  '3',
  '3.5',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '14',
  '16',
  '20',
  '24',
  '28',
  '32',
  '36',
  '40',
  '44',
  '48',
  '52',
  '56',
  '60',
  '64',
  '72',
  '80',
  '96',
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
  'thin',
  'extralight',
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
  'extrabold',
  'black',
  'left',
  'center',
  'right',
  'justify',
  'start',
  'end',
  'row',
  'col',
  'row-reverse',
  'col-reverse',
  'wrap',
  'wrap-reverse',
  'nowrap',
  'stretch',
  'initial',
  'inherit',
  'none',
  'block',
  'inline',
  'inline-block',
  'flex',
  'inline-flex',
  'grid',
  'inline-grid',
  'table',
  'inline-table',
  'hidden',
  'static',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'dvh',
  'svh',
  'lvh',
  't',
  'b',
  'l',
  'r',
  'x',
  'y',
  'solid',
  'dashed',
  'dotted',
  'double',
  'clip',
  'visible',
  'scroll',
  'top',
  'bottom',
  'left',
  'right',
  'all',
  'default',
]);

function tokenExists(className) {
  if (VALID_UTILITIES.has(className)) return true;
  const parts = className.split('-');
  if (parts.length < 2) return true;
  const prefix = parts[0] + '-';
  const mapEntry = UTILITY_TOKEN_MAP.find((e) => e.prefix === prefix);
  if (!mapEntry) return true;
  let suffix = parts.slice(1).join('-');
  // Strip opacity modifier (e.g., "muted/50" -> "muted")
  if (suffix.includes('/')) {
    suffix = suffix.split('/')[0];
  }
  if (STANDARD_TAILWIND_SUFFIXES.has(suffix)) return true;
  // Standard Tailwind colors (white, black, transparent, current, inherit)
  const STANDARD_COLORS = new Set([
    'white',
    'black',
    'transparent',
    'current',
    'inherit',
  ]);
  if (
    [
      'bg-',
      'text-',
      'border-',
      'ring-',
      'outline-',
      'shadow-',
      'accent-',
      'caret-',
      'fill-',
      'stroke-',
      'placeholder-',
      'decoration-',
    ].includes(prefix) &&
    STANDARD_COLORS.has(suffix)
  ) {
    return true;
  }
  const tokenName = mapEntry.token + suffix;
  if (VALID_TOKENS.has(tokenName)) return true;
  if (prefix === 'text-') {
    return VALID_TOKENS.has('--text-' + suffix);
  }
  return false;
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
