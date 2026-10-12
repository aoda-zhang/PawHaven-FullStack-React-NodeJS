#!/usr/bin/env node
// Token/style gate for the frontend. Scans apps/frontend and packages/ui for
// styling violations against the design system. Rules are a subset of
// style-doctor's commands: raw hex, raw palette names, CSS-variable bypass,
// inline style={{}} with static values, and px arbitrary values.
// Exit 0 = clean, 1 = violation, 2 = input error.
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join, relative, resolve } = require('node:path');

const repoRoot = resolve(__dirname, '..', '..', '..');

const TARGETS = ['apps/frontend', 'packages/ui'];
const FILE_TYPES = new Set(['.tsx', '.ts', '.css']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage']);

// Each rule cites the style-doctor rule it comes from. The inline-style rule
// flags static values only — a string literal or a standalone number as a
// property value. Dynamic runtime-computed values (e.g. `style={{ minHeight:
// rows * 20 }}` or `style={{ '--progress': `${p}%` }}`) are allowed per
// style-doctor Rule 4d and are not flagged.
const RULES = [
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

// Known pre-existing violations, pinned to file:line:rule. These are the same
// hits style-doctor reports as "Known hits — pre-existing, report as such".
// Editing the line retires the exception.
const KNOWN_VIOLATIONS = new Set([
  // style-doctor Rule 4d: two inline style={{}} with static scrollSnap values.
  'apps/frontend/portal/src/features/home/components/AdoptablePetsSection.tsx:25:inline-style',
  'apps/frontend/portal/src/features/home/components/PetCard.tsx:27:inline-style',
  // style-doctor Rule 2: raw Tailwind colour utilities.
  'apps/frontend/portal/src/layout/RootLayoutFooter.tsx:120:palette-name',
  'apps/frontend/portal/src/layout/RootLayoutFooter.tsx:132:palette-name',
  'apps/frontend/portal/src/layout/RootLayoutFooter.tsx:143:palette-name',
  'apps/frontend/portal/src/features/home/components/PetCard.tsx:40:palette-name',
  // style-doctor Rule 4b: px in an arbitrary value.
  'packages/ui/src/components/button/Button.tsx:9:px-arbitrary',
]);

function collectFiles(dir) {
  const out = [];
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
      for (const rule of RULES) {
        if (!rule.fileTypes.includes(ext)) continue;
        if (!rule.pattern.test(text)) continue;
        const key = `${rel}:${index + 1}:${rule.id}`;
        if (KNOWN_VIOLATIONS.has(key)) continue;
        failures.push(`${key}: ${rule.message} — ${text.trim()}`);
      }
    });
  }
}

console.log(`token-check: ${filesScanned} files scanned`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail  ${failure}`);
  process.exit(1);
}

console.log('token-check: OK');
