#!/usr/bin/env node
// Resolves what a review is looking at: the diff, the packages it touches, the capability areas it
// sits in, and the review dimensions that follow.
//
// It answers a question about the change, and it does not judge anything. A rule it happens to know
// the command for belongs in a reference; this file only locates.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const repoRoot = resolve(value('root', process.cwd()));
const explicitBase = value('base', null);

const git = (...cmd) =>
  execFileSync('git', ['--no-pager', ...cmd], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

const gitExists = (ref) => {
  try {
    git('rev-parse', '--verify', '--quiet', ref);
    return true;
  } catch {
    return false;
  }
};

// The base is whatever the caller said, or the nearest thing that exists: the merge base against the
// default branch when there is one, otherwise the previous commit. Guessing wrong here silently
// reviews the wrong diff, so the resolved ref is always printed.
function resolveBase() {
  if (explicitBase) {
    if (!gitExists(explicitBase)) {
      throw new Error(
        `--base ${explicitBase} is not a ref in this repository.`,
      );
    }
    return { ref: explicitBase, mode: 'explicit' };
  }
  for (const branch of ['origin/main', 'main', 'origin/develop', 'develop']) {
    if (!gitExists(branch)) continue;
    try {
      const mergeBase = git('merge-base', 'HEAD', branch).trim();
      if (mergeBase)
        return { ref: `${mergeBase}..HEAD`, mode: `merge-base:${branch}` };
    } catch {
      // An unrelated history has no merge base; fall through to the next candidate.
    }
  }
  if (gitExists('HEAD~1')) return { ref: 'HEAD~1', mode: 'previous-commit' };
  return { ref: 'HEAD', mode: 'empty-repo' };
}

const base = resolveBase();

function changedFiles() {
  const tracked =
    base.ref === 'HEAD' ? [] : git('diff', '--name-only', base.ref).split('\n');
  const status = git('status', '--porcelain').split('\n');
  const untracked = status
    .filter((line) => line.startsWith('?? '))
    .map((line) => line.slice(3).trim());
  const staged = status
    .filter((line) => !line.startsWith('?? ') && line.trim() !== '')
    .map((line) => line.slice(3).trim());
  return [
    ...new Set([...tracked, ...staged, ...untracked].filter(Boolean)),
  ].sort();
}

function nearestPackage(file) {
  let dir = dirname(join(repoRoot, file));
  while (dir.startsWith(repoRoot)) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      try {
        return {
          name: JSON.parse(readFileSync(manifest, 'utf8')).name,
          dir: relative(repoRoot, dir),
        };
      } catch {
        return null;
      }
    }
    const next = dirname(dir);
    if (next === dir) break;
    dir = next;
  }
  return null;
}

// Which part of the repository a path belongs to. This is a routing table, not a rule book: the
// rules themselves live in the reference each dimension points at.
function areaOf(file) {
  const f = file.split(sep).join('/');
  if (f.startsWith('docs/')) return 'docs';
  if (f.startsWith('harness-core/')) return 'harness';
  if (
    f.startsWith('apps/frontend/') ||
    f.startsWith('packages/ui/') ||
    f.startsWith('packages/frontend-core/')
  )
    return 'frontend';
  if (
    f.startsWith('apps/backend/') ||
    f.startsWith('packages/backend-core/') ||
    f.startsWith('packages/shared/')
  )
    return 'backend';
  if (f.startsWith('packages/design-system/') || f.startsWith('packages/i18n/'))
    return 'frontend';
  if (f.startsWith('e2e/') || f.includes('.test.') || f.includes('.spec.'))
    return 'tests';
  if (f.startsWith('packages/')) return 'packages';
  return 'repo';
}

const files = changedFiles();
const areas = new Set();
const packages = new Map();
for (const file of files) {
  areas.add(areaOf(file));
  const pkg = nearestPackage(file);
  if (pkg && pkg.name) packages.set(pkg.name, { name: pkg.name, dir: pkg.dir });
}

// Code quality, architecture, security and testing are applicable to any change in source. The rest
// follow the areas actually touched. `harness` and `docs` changes are reviewed as source changes too:
// a documentation change can describe a boundary that no longer exists.
const ALWAYS = ['code-quality', 'architecture', 'security', 'testing'];
// A Set, because two of these conditions overlap and a reviewer told "typescript, typescript" reads
// as a bug in the tool rather than as two dimensions.
const dimensions = new Set(ALWAYS);
if (areas.has('frontend')) dimensions.add('frontend');
if (areas.has('backend')) dimensions.add('backend');
if (areas.has('frontend') || areas.has('backend') || areas.has('packages'))
  dimensions.add('typescript');
if (files.some((f) => /\.(ts|tsx)$/.test(f))) dimensions.add('typescript');
// Performance follows a hot path, not a directory: a query, a loop over records, a payload, a
// subscription. Naming it here as a question keeps it from being silently skipped.
const hotPath = files.some(
  (f) =>
    /(service|controller|api|queries|mutations|repository)\.[tj]sx?$/.test(f) ||
    /\.service\.ts$/.test(f) ||
    /prisma\/schema\.prisma$/.test(f),
);
if (hotPath || files.length > 20) dimensions.add('performance');
const dimensionList = [...dimensions];

const scope =
  areas.has('frontend') && areas.has('backend')
    ? 'full-stack'
    : areas.has('frontend')
      ? 'frontend'
      : areas.has('backend')
        ? 'backend'
        : files.length === 0
          ? 'empty'
          : 'repo';

const report = {
  base: { ref: base.ref, mode: base.mode },
  scope,
  areas: [...areas].sort(),
  dimensions: dimensionList,
  fileCount: files.length,
  files,
  packages: [...packages.values()].sort((a, b) => a.name.localeCompare(b.name)),
  reactDoctorApplies: areas.has('frontend'),
  localeParityApplies: true,
};

if (flag('json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`review scope: ${scope}  (base ${base.ref}, ${base.mode})`);
  console.log(`changed files: ${files.length}`);
  console.log(`areas:        ${report.areas.join(', ') || 'none'}`);
  console.log(`dimensions:   ${dimensionList.join(', ')}`);
  console.log(
    `packages:     ${report.packages.map((p) => p.name).join(', ') || 'none'}`,
  );
  if (files.length <= 40) for (const f of files) console.log(`  ${f}`);
  else for (const f of files.slice(0, 40)) console.log(`  ${f}`);
}

if (files.length === 0 && !flag('allow-empty')) {
  console.error(
    'detect-review-scope: the diff is empty. Pass --base <ref> or --allow-empty.',
  );
  process.exit(2);
}
