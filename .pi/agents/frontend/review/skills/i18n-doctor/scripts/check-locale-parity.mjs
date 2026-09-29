#!/usr/bin/env node
/**
 * Locale parity check.
 *
 * Compares the leaf-key set of every locale directory against a reference
 * locale and exits non-zero when any of them drift. Zero dependencies: Node
 * builtins only, so it replaces the `jq` one-liners that assumed an undeclared
 * external binary.
 *
 *   node .opencode/skills/code-review/i18n-doctor/scripts/check-locale-parity.mjs
 *   node ... --locales packages/i18n/locales --reference en-US
 *
 * Exit codes: 0 all locales match, 1 drift found, 2 bad input.
 *
 * Two limits worth knowing before trusting a clean run:
 *   - An array is one leaf, so a locale that translated fewer list items than
 *     the reference is not reported. Index paths would be noise that churns
 *     on every reorder.
 *   - Paths are built from the top-level key inside each file, not its name.
 *     Two files claiming the same top-level key (en-US/rescueGuide.json and
 *     en-US/documents/pdf/rescueGuide.json both use "rescueGuide") therefore
 *     merge into one namespace. A collision is reported on stderr.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { argv } from 'node:process';

const DEFAULT_LOCALES_DIR = 'packages/i18n/locales';
const DEFAULT_REFERENCE = 'en-US';

const USAGE = `Usage: check-locale-parity.mjs [--locales <dir>] [--reference <locale>]

  --locales <dir>       Locales root, one directory per locale
                        (default: ${DEFAULT_LOCALES_DIR})
  --reference <locale>  Locale every other locale is compared against
                        (default: ${DEFAULT_REFERENCE})
  -h, --help            Print this help`;

const count = (n) => String(n).padStart(4, ' ');
const pad = (name) => name.padEnd(8, ' ');

/** A leaf is any non-object JSON value, so an array counts as one leaf. */
function collectLeaves(value, prefix, into) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      collectLeaves(value[key], prefix ? `${prefix}.${key}` : key, into);
    }
    return into;
  }
  into.add(prefix);
  return into;
}

/** Every *.json under dir, nested sub-directories included. */
function listJsonFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listJsonFiles(full));
    else if (entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(2);
}

function parseArgs(args) {
  const options = {
    localesDir: DEFAULT_LOCALES_DIR,
    reference: DEFAULT_REFERENCE,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      process.stdout.write(`${USAGE}\n`);
      process.exit(0);
    } else if (arg === '--locales' || arg === '--reference') {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        fail(`${arg} needs a value\n${USAGE}`);
      }
      options[arg === '--locales' ? 'localesDir' : 'reference'] = value;
      i += 1;
    } else {
      fail(`unknown argument "${arg}"\n${USAGE}`);
    }
  }
  return options;
}

/** The dotted leaf paths of one locale, plus the top-level keys that collide. */
function readLocale(dir) {
  const paths = new Set();
  const ownerOfTopKey = new Map();
  for (const file of listJsonFiles(dir)) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch (cause) {
      fail(`${file} is not valid JSON: ${cause.message}`);
    }
    const here = relative(dir, file);
    for (const topKey of Object.keys(parsed)) {
      const previous = ownerOfTopKey.get(topKey);
      if (previous !== undefined) {
        process.stderr.write(
          `warning: ${dir}: "${topKey}" is claimed by both ${previous} and ${here}; ` +
            'their keys share one namespace\n',
        );
      } else {
        ownerOfTopKey.set(topKey, here);
      }
      collectLeaves(parsed[topKey], topKey, paths);
    }
  }
  return paths;
}

function sortedDifference(left, right) {
  return [...left].filter((key) => !right.has(key)).sort();
}

/**
 * i18next resolves `t(key, { count })` against the locale's CLDR plural
 * categories. A key suffixed `_one` is therefore never read in a locale that
 * only has `other` — Chinese, Japanese and Korean have no plural distinction.
 * Reporting those as missing is a false positive, so they are partitioned out
 * and counted separately rather than as drift.
 */
function pluralSuffixOf(key) {
  const match = /_(zero|one|two|few|many|other)$/.exec(
    key.slice(key.lastIndexOf('.') + 1),
  );
  return match ? match[1] : undefined;
}

function pluralCategoriesOf(locale) {
  try {
    return new Set(
      new Intl.PluralRules(locale).resolvedOptions().pluralCategories,
    );
  } catch {
    return new Set(['other']);
  }
}

const { localesDir, reference } = parseArgs(argv.slice(2));

let localesStat;
try {
  localesStat = statSync(localesDir);
} catch {
  fail(`locales directory not found: ${localesDir}`);
}
if (!localesStat.isDirectory()) fail(`not a directory: ${localesDir}`);

const localeNames = readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !name.startsWith('.'))
  .sort();

if (localeNames.length === 0) fail(`no locale directories under ${localesDir}`);
if (!localeNames.includes(reference)) {
  fail(
    `reference locale "${reference}" not found under ${localesDir} (found: ${localeNames.join(', ')})`,
  );
}

const keysByLocale = new Map();
for (const name of localeNames) {
  keysByLocale.set(name, readLocale(join(localesDir, name)));
}
const referenceKeys = keysByLocale.get(reference);

const out = [];
out.push(
  `locales=${localesDir} reference=${reference} found=${localeNames.join(',')}`,
);

let drifted = false;
for (const name of localeNames) {
  const keys = keysByLocale.get(name);
  if (name === reference) {
    out.push(`${pad(name)} ${count(keys.size)} keys  reference`);
    continue;
  }
  const categories = pluralCategoriesOf(name);
  const missing = [];
  const pluralOnly = [];
  for (const key of sortedDifference(referenceKeys, keys)) {
    const suffix = pluralSuffixOf(key);
    (suffix && !categories.has(suffix) ? pluralOnly : missing).push(key);
  }
  const extra = sortedDifference(keys, referenceKeys);
  if (missing.length === 0 && extra.length === 0) {
    const note =
      pluralOnly.length === 0
        ? 'ok'
        : `ok  (${pluralOnly.length} plural variant n/a here)`;
    out.push(`${pad(name)} ${count(keys.size)} keys  ${note}`);
    continue;
  }
  drifted = true;
  out.push(
    `${pad(name)} ${count(keys.size)} keys  ${missing.length} missing, ` +
      `${extra.length} only-here`,
  );
  for (const key of missing) out.push(`${pad(name)} missing  ${key}`);
  for (const key of extra) out.push(`${pad(name)} only     ${key}`);
}

process.stdout.write(`${out.join('\n')}\n`);
process.exit(drifted ? 1 : 0);
