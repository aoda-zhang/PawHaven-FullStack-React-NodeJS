#!/usr/bin/env node
/**
 * Package contract check for @pawhaven/ui.
 *
 * The `exports` map of a workspace package is a promise to its consumers:
 * every path listed there must exist in the built output, every named export
 * re-exported from the source entry points must survive the TypeScript build,
 * and the `sideEffects` field must actually cover the stylesheets the package
 * ships. This script asserts that promise against the *built* package so a
 * broken export map fails in CI instead of at runtime in the Portal.
 *
 * Usage:
 *   node packages/ui/scripts/verify-package.mjs
 *   pnpm --filter @pawhaven/ui verify:package
 *
 * Exit codes (matching packages/design-system/scripts/token-check.cjs):
 *   0 = clean
 *   1 = contract violation
 *   2 = input error (package not built, manifest missing, ...)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const repoRoot = resolve(pkgRoot, '..', '..');

const violations = [];

function fail(message) {
  violations.push(message);
}

function inputError(message) {
  console.error(`verify-package: input error: ${message}`);
  process.exit(2);
}

// ── Manifest ──────────────────────────────────────────────────

const manifestPath = join(pkgRoot, 'package.json');
if (!existsSync(manifestPath)) {
  inputError(`package manifest not found: ${manifestPath}`);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  inputError(`package manifest is not valid JSON: ${error.message}`);
}

if (!manifest.exports || typeof manifest.exports !== 'object') {
  inputError('package.json has no "exports" map');
}

// ── Helpers ───────────────────────────────────────────────────

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** Turn a sideEffects glob into an anchored regular expression. */
function globToRegExp(pattern) {
  let out = '^';
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        i += 1;
        if (pattern[i + 1] === '/') {
          i += 1;
          out += '(?:.*/)?';
        } else {
          out += '.*';
        }
      } else {
        out += '[^/]*';
      }
      continue;
    }
    if (char === '?') {
      out += '[^/]';
      continue;
    }
    out += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  out += '$';
  return new RegExp(out);
}

function matchesAnyGlob(patterns, relativePath) {
  return patterns.some((pattern) => globToRegExp(pattern).test(relativePath));
}

// ── 1. Every exports target exists on disk ────────────────────

function collectExportTargets(exportsMap, prefix) {
  const targets = [];
  for (const [subpath, value] of Object.entries(exportsMap)) {
    if (typeof value === 'string') {
      targets.push({ subpath, condition: 'default', target: value });
      continue;
    }
    if (!value || typeof value !== 'object') {
      fail(`exports["${subpath}"] is neither a string nor a condition object`);
      continue;
    }
    for (const [condition, target] of Object.entries(value)) {
      if (typeof target !== 'string') continue;
      if (target.includes('*')) {
        fail(
          `exports["${subpath}"].${condition} uses a wildcard target ("${target}") which cannot be verified`,
        );
        continue;
      }
      targets.push({ subpath, condition, target });
    }
  }
  return targets;
}

const exportTargets = collectExportTargets(manifest.exports, '.');

for (const { subpath, condition, target } of exportTargets) {
  if (!target.startsWith('./')) {
    fail(
      `exports["${subpath}"].${condition} target "${target}" is not a relative "./" path`,
    );
    continue;
  }
  const absolute = join(pkgRoot, target);
  if (!existsSync(absolute)) {
    fail(
      `exports["${subpath}"].${condition} points at "${target}" which does not exist (run the package build first)`,
    );
  }
}

// ── 2. Entry points exist and are non-empty ───────────────────

const buildDir = join(pkgRoot, 'build');
if (!existsSync(buildDir) || !statSync(buildDir).isDirectory()) {
  inputError(
    'packages/ui/build does not exist — run `pnpm --filter @pawhaven/ui build` before verifying the package contract',
  );
}

const ENTRY_MODULES = [
  { file: 'build/index.js', source: 'src/index.ts' },
  {
    file: 'build/components/form/index.js',
    source: 'src/components/form/index.ts',
  },
];

for (const { file } of ENTRY_MODULES) {
  const absolute = join(pkgRoot, file);
  if (!existsSync(absolute)) {
    fail(`build output "${file}" is missing`);
    continue;
  }
  if (!isFile(absolute)) {
    fail(`build output "${file}" is not a file`);
    continue;
  }
  if (statSync(absolute).size === 0) {
    fail(`build output "${file}" is empty`);
  }
}

// ── 3. Named exports survive the build ────────────────────────

/**
 * Collect the *value* export names declared by a module.
 * `export type { ... }` and inline `type` specifiers are skipped: they are
 * erased by TypeScript and therefore never appear in the emitted JavaScript.
 */
function collectDeclaredExportNames(source) {
  const names = new Set();

  // export { a, b as c } [from '...']  (skipping `export type { ... }`)
  const braceRe = /(^|[\s;}])(export)\s*(\{[^}]*\})/g;
  let match;
  while ((match = braceRe.exec(source)) !== null) {
    const afterExport = source.slice(match.index + match[1].length);
    if (/^export\s+type\s/.test(afterExport)) continue;
    const braces = match[3];
    for (const rawSpecifier of braces.slice(1, -1).split(',')) {
      const specifier = rawSpecifier.trim();
      if (!specifier) continue;
      if (/^type\s/.test(specifier)) continue;
      const parts = specifier.split(/\s+as\s+/);
      const exported = (parts[1] ?? parts[0]).trim();
      if (exported) names.add(exported);
    }
  }

  // export default …
  if (/(^|[\s;}])export\s+default[\s({]/.test(source)) {
    names.add('default');
  }

  // export const/let/var/function/class/async function …
  const declRe =
    /(^|[\s;}])export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((match = declRe.exec(source)) !== null) {
    names.add(match[2]);
  }

  return names;
}

/** Collect the export names of an emitted ES module, following `export *`. */
function collectBuiltExportNames(absolutePath, seen = new Set()) {
  const names = new Set();
  if (seen.has(absolutePath)) return names;
  seen.add(absolutePath);

  const source = readFileSync(absolutePath, 'utf8');
  const dir = dirname(absolutePath);

  // export { a, b as c } [from '...']
  const braceRe = /(^|[\s;}])(export)\s*(\{[^}]*\})/g;
  let match;
  while ((match = braceRe.exec(source)) !== null) {
    const afterExport = source.slice(match.index + match[1].length);
    if (/^export\s+type\s/.test(afterExport)) continue;
    const braces = match[3];
    for (const rawSpecifier of braces.slice(1, -1).split(',')) {
      const specifier = rawSpecifier.trim();
      if (!specifier) continue;
      if (/^type\s/.test(specifier)) continue;
      const parts = specifier.split(/\s+as\s+/);
      const exported = (parts[1] ?? parts[0]).trim();
      if (exported) names.add(exported);
    }
  }

  // export * from './x'  /  export * as ns from './x'
  const starRe =
    /(^|[\s;}])export\s*\*\s*(?:as\s+([A-Za-z_$][\w$]*)\s*)?from\s*['"]([^'"]+)['"]/g;
  while ((match = starRe.exec(source)) !== null) {
    if (match[2]) {
      names.add(match[2]);
      continue;
    }
    const specifier = match[3];
    if (!specifier.startsWith('.')) continue;
    const target = resolve(dir, specifier);
    for (const candidate of [
      target,
      `${target}.js`,
      join(target, 'index.js'),
    ]) {
      if (isFile(candidate)) {
        for (const name of collectBuiltExportNames(candidate, seen))
          names.add(name);
        break;
      }
    }
  }

  // export default …
  if (/(^|[\s;}])export\s+default[\s({]/.test(source)) {
    names.add('default');
  }

  // export const/let/var/function/class/async function …
  const declRe =
    /(^|[\s;}])export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((match = declRe.exec(source)) !== null) {
    names.add(match[2]);
  }

  return names;
}

for (const { file, source } of ENTRY_MODULES) {
  const sourcePath = join(pkgRoot, source);
  if (!isFile(sourcePath)) {
    inputError(`source entry point not found: ${source}`);
  }
  const builtPath = join(pkgRoot, file);
  if (!isFile(builtPath)) continue;

  const declared = collectDeclaredExportNames(readFileSync(sourcePath, 'utf8'));
  const built = collectBuiltExportNames(builtPath);

  for (const name of declared) {
    if (!built.has(name)) {
      fail(
        `"${name}" is exported by ${source} but missing from the built module ${file}`,
      );
    }
  }
}

// ── 4. index.css exists and sideEffects covers it ─────────────

const cssPath = join(pkgRoot, 'index.css');
if (!isFile(cssPath)) {
  fail(
    'index.css is missing — the package must ship its stylesheet entry point',
  );
} else {
  const sideEffects = manifest.sideEffects;
  if (sideEffects === undefined) {
    fail(
      'package.json has no "sideEffects" field — bundlers may tree-shake index.css away',
    );
  } else if (sideEffects === false) {
    fail(
      'package.json declares "sideEffects": false but the package ships index.css',
    );
  } else if (Array.isArray(sideEffects)) {
    if (sideEffects.length === 0) {
      fail(
        'package.json declares an empty "sideEffects" array but the package ships index.css',
      );
    } else if (!matchesAnyGlob(sideEffects, 'index.css')) {
      fail(
        `the "sideEffects" patterns ${JSON.stringify(sideEffects)} do not match "index.css" — the stylesheet can be tree-shaken away`,
      );
    }
  } else {
    fail(
      `the "sideEffects" field must be an array or false, received ${typeof sideEffects}`,
    );
  }
}

// ── 5. The build output is not committed to git ────────────────

const buildRelative = relative(repoRoot, buildDir);

function gitAvailable() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

if (gitAvailable()) {
  try {
    execFileSync('git', ['check-ignore', '-q', buildRelative], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
  } catch (error) {
    if (error && error.status === 1) {
      fail(
        `"${buildRelative}" is not gitignored — the build output must never be committed`,
      );
    } else {
      inputError(`git check-ignore failed for "${buildRelative}"`);
    }
  }

  let tracked = '';
  try {
    tracked = execFileSync('git', ['ls-files', '--', buildRelative], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    inputError(`git ls-files failed for "${buildRelative}": ${error.message}`);
  }
  if (tracked.trim() !== '') {
    fail(
      `"${buildRelative}" is tracked by git — the build output must never be committed`,
    );
  }
} else {
  // No git available: fall back to the repository .gitignore content.
  const gitignorePath = join(repoRoot, '.gitignore');
  if (!isFile(gitignorePath)) {
    inputError('git is unavailable and no repository .gitignore was found');
  }
  const patterns = readFileSync(gitignorePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const ignored = patterns.some((pattern) => {
    const normalized = pattern.replace(/^\//, '').replace(/\/$/, '');
    return (
      buildRelative === normalized ||
      buildRelative.startsWith(`${normalized}/`) ||
      normalized === 'build' ||
      normalized === 'dist'
    );
  });
  if (!ignored) {
    fail(
      `"${buildRelative}" is not covered by the repository .gitignore — the build output must never be committed`,
    );
  }
}

// ── Report ────────────────────────────────────────────────────

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`fail  ${violation}`);
  }
  console.error(`verify-package: ${violations.length} contract violation(s)`);
  process.exit(1);
}

console.log(
  `verify-package: OK — ${exportTargets.length} export target(s) resolved, ${ENTRY_MODULES.length} entry module(s) checked, build output is gitignored`,
);
