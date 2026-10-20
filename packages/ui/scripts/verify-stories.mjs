#!/usr/bin/env node
/**
 * Story coverage check for the @pawhaven/ui catalogue.
 *
 * The catalogue is only useful when every exported component has a story that
 * actually built. This script derives the component list from the package's own
 * public barrels (`src/index.ts` and `src/components/form/index.ts`), derives the
 * story file each component must own from the module it is exported from, and
 * then asserts the story exists in the source tree *and* in the built
 * Storybook index. A file that is never picked up by the story glob proves
 * nothing, so the built index is the source of truth.
 *
 * Story file convention: a component exported from `<dir>/<Component>.tsx` owns
 * the colocated `<dir>/<Component>.stories.tsx`. The Timeline compound parts
 * share `timeline/Timeline.stories.tsx` because they share one module.
 *
 * Behavioural stories are asserted by name because a catalogue entry can exist
 * without proving the behaviour it is named after.
 *
 * Usage:
 *   node packages/ui/scripts/verify-stories.mjs
 *   pnpm --filter @pawhaven/ui build-storybook && node packages/ui/scripts/verify-stories.mjs
 *
 * Exit codes:
 *   0 = clean
 *   1 = coverage violation
 *   2 = input error (catalogue not built, barrel missing, ...)
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const builtIndexPath = join(
  packageRoot,
  'dist',
  'storybook-static',
  'index.json',
);

const violations = [];

function fail(message) {
  violations.push(message);
}

function inputError(message) {
  console.error(`verify-stories: input error: ${message}`);
  process.exit(2);
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function toPosix(path) {
  return path.split(sep).join('/');
}

// ── 1. The built catalogue ─────────────────────────────────────

if (!existsSync(builtIndexPath)) {
  inputError(
    `the built catalogue is missing at ${builtIndexPath} — run "pnpm --filter @pawhaven/ui build-storybook" first`,
  );
}

let builtIndex;
try {
  builtIndex = JSON.parse(readFileSync(builtIndexPath, 'utf8'));
} catch (error) {
  inputError(`the built catalogue is not valid JSON: ${error.message}`);
}

const builtEntries = Object.values(
  builtIndex.entries ?? builtIndex.stories ?? {},
).filter((entry) => entry.type === undefined || entry.type === 'story');

// ── 2. The exported component list ──────────────────────────────

const BARRELS = ['src/index.ts', 'src/components/form/index.ts'];

/** PascalCase names are components; helpers such as `cn` or `showToast` are not. */
function isComponentName(name) {
  return /^[A-Z][a-z]/.test(name);
}

/**
 * Collect the component exports of a barrel together with the module they come
 * from. `export type { … }` blocks and `type` specifiers are skipped: they are
 * erased by TypeScript and never reach the catalogue.
 */
function collectComponentExports(source) {
  const components = [];
  const exportRe =
    /export\s+(type\s+)?\{([^}]*)\}\s*(?:from\s*['"]([^'"]+)['"])?/g;
  let match;

  while ((match = exportRe.exec(source)) !== null) {
    if (match[1]) continue;

    const specifier = match[3];
    for (const rawName of match[2].split(',')) {
      const name = rawName.trim();
      if (!name || name.startsWith('type ')) continue;
      const local = name.split(/\s+as\s+/)[0].trim();
      if (!isComponentName(local)) continue;
      components.push({ name: local, specifier });
    }
  }

  return components;
}

const components = [];

for (const barrel of BARRELS) {
  const barrelPath = join(packageRoot, barrel);
  if (!isFile(barrelPath)) {
    inputError(`public barrel not found: ${barrel}`);
  }

  const barrelDirectory = dirname(barrelPath);
  for (const component of collectComponentExports(
    readFileSync(barrelPath, 'utf8'),
  )) {
    if (!component.specifier) {
      fail(
        `"${component.name}" is exported by ${barrel} without a module specifier, so its story file cannot be derived`,
      );
      continue;
    }

    const modulePath = toPosix(
      relative(packageRoot, resolve(barrelDirectory, component.specifier)),
    );
    const sourceFile = ['.tsx', '.ts']
      .map((extension) => `${modulePath}${extension}`)
      .find((candidate) => isFile(join(packageRoot, candidate)));

    if (!sourceFile) {
      fail(
        `"${component.name}" is exported by ${barrel} from "${modulePath}", which has no source file`,
      );
      continue;
    }

    components.push({
      name: component.name,
      barrel,
      sourceFile,
      storyFile: sourceFile.replace(/\.tsx?$/, '.stories.tsx'),
    });
  }
}

if (components.length === 0) {
  inputError('no component exports were found in the public barrels');
}

// ── 3. Every component owns a story, in the source and in the build ──

for (const component of components) {
  if (!isFile(join(packageRoot, component.storyFile))) {
    fail(`"${component.name}" has no story file at ${component.storyFile}`);
    continue;
  }

  const built = builtEntries.filter((entry) =>
    (entry.importPath ?? '').endsWith(component.storyFile),
  );
  if (built.length === 0) {
    fail(
      `"${component.name}" has no built story — ${component.storyFile} is not part of the built catalogue`,
    );
  }
}

// ── 4. The behavioural stories ──────────────────────────────────
//
// Every entry below is a behaviour the catalogue is expected to demonstrate.
// The `story` field records where the story lives after the split into
// per-component files; the `covers` field records why it is required.

const REQUIRED_STORIES = [
  {
    name: 'Form Control Variants',
    story: 'src/components/form/FormPatterns.stories.tsx',
    covers: 'the size and variant matrix shared by the form controls',
  },
  {
    name: 'Mobile Form Layout',
    story: 'src/components/form/FormPatterns.stories.tsx',
    covers: 'the form family pinned to the mobile viewport',
  },
  {
    name: 'Tablet Form Layout',
    story: 'src/components/form/FormPatterns.stories.tsx',
    covers: 'the form family pinned to the tablet viewport',
  },
  {
    name: 'Password Field',
    story: 'src/components/form/form-input/FormInput.stories.tsx',
    covers: 'the password input with its visibility toggle',
  },
];

for (const required of REQUIRED_STORIES) {
  const match = builtEntries.find(
    (entry) =>
      (entry.name ?? '').toLowerCase() === required.name.toLowerCase() &&
      (entry.importPath ?? '').endsWith(required.story),
  );
  if (!match) {
    fail(
      `the "${required.name}" story is missing from ${required.story} (${required.covers})`,
    );
  }
}

// ── Report ─────────────────────────────────────────────────────

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`fail  ${violation}`);
  }
  console.error(`verify-stories: ${violations.length} coverage violation(s)`);
  process.exit(1);
}

const storyFiles = new Set(components.map((component) => component.storyFile));
console.log(
  `verify-stories: OK — ${components.length} exported component(s) covered by ${storyFiles.size} story file(s), ${builtEntries.length} story entries built, ${REQUIRED_STORIES.length} behavioural story/stories present`,
);
