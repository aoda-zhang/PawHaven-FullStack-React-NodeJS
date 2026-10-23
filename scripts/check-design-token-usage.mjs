#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scopes = [
  'packages/design-system/src',
  'packages/ui/src',
  'packages/frontend-core/src',
  'apps/frontend/portal/src',
  'apps/backend/document-service/src/modules/pdf',
];
const ignored = new Set(['node_modules', 'dist', 'build', 'coverage', '.next']);
const extensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const findings = [];

function walk(target) {
  const absolute = join(root, target);
  let stat;
  try {
    stat = statSync(absolute);
  } catch {
    console.error(`design-token-audit: configured scope missing: ${target}`);
    process.exitCode = 2;
    return [];
  }
  if (stat.isFile()) return [absolute];
  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) files.push(...walk(join(target, entry.name)));
    } else if (extensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) {
      files.push(join(absolute, entry.name));
    }
  }
  return files;
}

const rawPalette = /\b(?:text|bg|border|ring|outline|fill|stroke|from|via|to|decoration|placeholder|divide|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|brown)-\d+\b/g;
const arbitraryHexColor = /\b(?:text|bg|border|ring|outline|shadow|fill|stroke|from|via|to)-\[#[0-9a-fA-F]{3,8}\]/g;
const rawHex = /#[0-9a-fA-F]{3,8}\b/g;
const rawRadius = /\brounded-(?:xs|sm|md|lg|xl|2xl|3xl)(?:\/\d+)?\b/g;
const arbitraryRadius = /\brounded-\[[^\]]+\]/g;

for (const scope of scopes) {
  for (const file of walk(scope)) {
    const original = readFileSync(file, 'utf8');
    const source = original
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      if (file.endsWith('.css') && /^\s*\/\*/.test(line)) return;
      for (const [rule, pattern] of [
        ...(!file.includes('/packages/design-system/src/tokens/') ? [['raw-hex', rawHex]] : []),
        ['raw-palette', rawPalette],
        ['arbitrary-hex-color', arbitraryHexColor],
        ['raw-radius', rawRadius],
        ['arbitrary-radius', arbitraryRadius],
      ]) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          findings.push({
            file: relative(root, file),
            line: index + 1,
            rule,
            value: match[0],
          });
        }
      }
    });
  }
}

console.log(`design-token-audit: ${findings.length} violation(s)`);
for (const finding of findings) {
  console.log(`fail ${finding.file}:${finding.line} [${finding.rule}] ${finding.value}`);
}
if (findings.length) process.exitCode = 1;
