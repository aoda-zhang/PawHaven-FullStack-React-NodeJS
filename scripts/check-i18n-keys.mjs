#!/usr/bin/env node
/**
 * Checks that every translation key the portal and `frontend-core` use exists
 * in the locale documents. A key that is missing renders as its own name on
 * screen, which is easy to miss in review and impossible to notice in a
 * screenshot.
 *
 * Exit 0 = clean, 1 = missing key, 2 = input error.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const localesDir = path.join(repoRoot, 'packages/i18n/locales');
const sourceDirs = [
  path.join(repoRoot, 'apps/frontend/portal/src'),
  path.join(repoRoot, 'packages/frontend-core/src'),
];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Every key a locale defines, and the keys whose value is an object or an
 * array — those are read with `returnObjects: true`.
 */
function readLocale(locale) {
  const dir = path.join(localesDir, locale);
  const keys = new Set();
  const objects = new Set();

  const walk = (value, prefix) => {
    for (const [key, child] of Object.entries(value)) {
      const full = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === 'object') {
        objects.add(full);
        walk(child, full);
      } else {
        keys.add(full);
      }
    }
  };

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    walk(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')), '');
  }

  return { keys, objects };
}

function collectSourceFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'build', 'dist', 'coverage'].includes(entry.name))
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(full));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const locales = fs.readdirSync(localesDir);
const localeKeys = Object.fromEntries(locales.map((l) => [l, readLocale(l)]));

const used = new Map();
for (const dir of sourceDirs) {
  for (const file of collectSourceFiles(dir)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /\bt\(\s*['"]([a-zA-Z][\w.]*)['"]([^)]*)\)/g,
    )) {
      const key = match[1];
      // A key read with `returnObjects: true` names a document, not a leaf.
      const asObject = /returnObjects\s*:\s*true/.test(match[2] ?? '');
      if (!used.has(key)) used.set(key, { files: new Set(), asObject });
      used.get(key).files.add(path.relative(repoRoot, file));
      if (asObject) used.get(key).asObject = true;
    }
  }
}

const missing = [];
for (const [key, { files, asObject }] of used) {
  const broken = locales.filter((locale) => {
    const { keys, objects } = localeKeys[locale];
    if (asObject) return !objects.has(key) && !keys.has(key);
    if (keys.has(key)) return false;
    // i18next resolves plurals through the `_one` / `_other` suffixes.
    const base = key.replace(/_(one|other)$/, '');
    return !(
      keys.has(base) ||
      keys.has(`${base}_one`) ||
      keys.has(`${base}_other`)
    );
  });
  if (broken.length) {
    missing.push({ key, broken, files: [...files] });
  }
}

console.log(
  `i18n-keys: ${used.size} key(s) used, ${locales.length} locale(s), ${localeKeys[locales[0]].keys.size} key(s) defined per locale`,
);

if (missing.length > 0) {
  for (const { key, broken, files } of missing.sort((a, b) =>
    a.key.localeCompare(b.key),
  )) {
    console.error(`fail  ${key}  missing in ${broken.join(', ')}`);
    console.error(`      used in ${files.join(', ')}`);
  }
  process.exit(1);
}

console.log('i18n-keys: OK');
