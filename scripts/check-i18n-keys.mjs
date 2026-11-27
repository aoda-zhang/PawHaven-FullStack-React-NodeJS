#!/usr/bin/env node
/**
 * Two checks over the translation catalogue, because both fail silently in review:
 *
 * 1. Missing keys — every key the portal, `frontend-core`, and shared schemas use must exist in
 *    every locale. A missing key renders as its own name on screen, which is easy to miss in a
 *    screenshot.
 * 2. Duplicate values — a key added or changed by this diff whose value already exists under
 *    another key. Two copies of one sentence drift apart the moment one is edited, so each hit is
 *    a suggestion to promote the sentence to `common.*`. Only the current diff is compared:
 *    flagging every historical duplicate would drown the signal. Advisory unless `--strict`.
 *
 * Usage: node scripts/check-i18n-keys.mjs [--base <git-ref>] [--strict]
 * Exit 0 = clean, 1 = missing key (or duplicate value with --strict), 2 = input error.
 */
import { execFileSync } from 'node:child_process';
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
const sharedSchemaDir = path.join(repoRoot, 'packages/shared/types');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
/** Values shorter than this are too generic to recommend sharing. */
const MIN_SHAREABLE_VALUE = 3;

const argv = process.argv.slice(2);
const baseIndex = argv.indexOf('--base');
const baseRef = baseIndex === -1 ? 'HEAD~1' : argv[baseIndex + 1];
const strict = argv.includes('--strict');
const isAnnotated = Boolean(process.env.GITHUB_ACTIONS);

if (baseIndex !== -1 && !argv[baseIndex + 1]) {
  console.error('i18n-keys: --base requires a git ref');
  process.exit(2);
}

/**
 * Every key a locale defines, the keys whose value is an object or an array (read with
 * `returnObjects: true`), the leaf values, and the same values grouped by file.
 */
function readLocale(locale) {
  const dir = path.join(localesDir, locale);
  const keys = new Set();
  const objects = new Set();
  const values = new Map();
  const byFile = new Map();

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const relativePath = path.relative(repoRoot, path.join(dir, file));
    const flattened = new Map();
    const walk = (value, prefix) => {
      for (const [key, child] of Object.entries(value)) {
        const full = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === 'object') {
          objects.add(full);
          walk(child, full);
        } else {
          keys.add(full);
          flattened.set(full, child);
          values.set(full, child);
        }
      }
    };
    walk(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')), '');
    byFile.set(relativePath, flattened);
  }

  return { keys, objects, values, byFile };
}

/** The same file at the base commit, or null when git cannot answer (shallow clone, new file). */
function readBaseFile(relativePath) {
  try {
    const raw = execFileSync('git', ['show', `${baseRef}:${relativePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const flattened = new Map();
    const walk = (value, prefix) => {
      for (const [key, child] of Object.entries(value)) {
        const full = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === 'object') walk(child, full);
        else flattened.set(full, child);
      }
    };
    walk(JSON.parse(raw), '');
    return flattened;
  } catch {
    return null;
  }
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

// --- 1. Missing keys -------------------------------------------------------------------------
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

for (const file of collectSourceFiles(sharedSchemaDir)) {
  if (file.endsWith('.test.ts')) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(
    /(['"])([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)\1/g,
  )) {
    const key = match[2];
    if (!used.has(key)) used.set(key, { files: new Set(), asObject: false });
    used.get(key).files.add(path.relative(repoRoot, file));
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

// --- 2. Duplicate values introduced by this diff ---------------------------------------------
const duplicates = [];
let comparedLocales = 0;

for (const locale of locales) {
  const { values, byFile } = localeKeys[locale];
  const valueIndex = new Map();
  for (const [key, value] of values) {
    if (!valueIndex.has(value)) valueIndex.set(value, []);
    valueIndex.get(value).push(key);
  }

  let comparable = false;
  for (const [relativePath, flattened] of byFile) {
    const base = readBaseFile(relativePath);
    if (base === null) continue;
    comparable = true;

    for (const [key, value] of flattened) {
      if (base.get(key) === value) continue; // unchanged
      if (typeof value !== 'string') continue;
      if (value.trim().length < MIN_SHAREABLE_VALUE) continue;
      // Interpolated sentences are not interchangeable even when they read the same.
      if (value.includes('${')) continue;

      const others = (valueIndex.get(value) ?? []).filter(
        (candidate) => candidate !== key,
      );
      if (others.length === 0) continue;
      duplicates.push({ locale, key, others: others.slice(0, 3), value });
    }
  }
  if (comparable) comparedLocales += 1;
}

if (comparedLocales === 0) {
  console.log(
    `i18n-duplicates: skipped — git cannot resolve "${baseRef}" (needs full history)`,
  );
} else if (duplicates.length === 0) {
  console.log(
    `i18n-duplicates: no new duplicate value (base ${baseRef}, ${comparedLocales} locale(s))`,
  );
} else {
  for (const { locale, key, others, value } of duplicates) {
    const line = `${locale}  "${key}" == "${others.join('", "')}"  → "${value}"`;
    console.log(`duplicate-value  ${line}`);
    if (isAnnotated) {
      console.log(
        `::warning title=Duplicate translation value::${line}. Promote the shared sentence to common.* and reference it from both keys.`,
      );
    }
  }
  console.log(
    `i18n-duplicates: ${duplicates.length} new duplicate value(s) across ${new Set(duplicates.map((d) => d.locale)).size} locale(s).`,
  );
  if (strict) process.exit(1);
}

console.log('i18n-keys: OK');
