#!/usr/bin/env node
// Architecture boundary check for PawHaven. Pure Node, zero dependencies, no
// assumption of rg/jq. Scans imports recursively and fails on violations.
// Exit 1 = violation.
//
// Rule sources (cited per rule):
// - A1: PawHaven-Frontend-Architecture.md §3.3 (Package Dependency Rules) and
//   service-boundaries.md §1 (The four services) + §9 (Frontend axis).
// - A2: PawHaven-Frontend-Architecture.md §2.3 (Feature Isolation Rules, P2
//   "Features are isolated" and "Feature A → Feature B (any import)").
// - A3: service-boundaries.md §5 (core-service: "Cross-module imports exist
//   in exactly one place").
// - A4: frontend-portal.md ("There is no `apps/frontend/admin`") and
//   service-boundaries.md §9 ("apps/frontend/portal is the only frontend app").
// - A5: frontend-architecture.md §2 (Dependencies — a layer reads only the
//   layers below it; `src/shared/` is the bottom one in the portal).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.pi',
  'npm',
]);

function collectSource(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...collectSource(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const TS_EXTS = ['.ts', '.tsx', '.mts', '.cts'];

// ---------------------------------------------------------------------------
// A1. Package direction.
//
// Sources: frontend-architecture §3.3; service-boundaries §1, §9.
// - `ui` must not reach frontend-core or features.
// - frontend-core must not reach features.
// - apps must not import each other.
// - backend services import packages only, never each other.
// - `shared` carries zero @pawhaven/* workspace dependencies.
// ---------------------------------------------------------------------------

function readPackageDeps(pkgDir) {
  const manifest = join(repoRoot, pkgDir, 'package.json');
  if (!existsSync(manifest)) return null;
  const json = JSON.parse(readFileSync(manifest, 'utf8'));
  return {
    ...(json.dependencies ?? {}),
    ...(json.peerDependencies ?? {}),
  };
}

const workspaceDep = (deps, name) =>
  deps && Object.keys(deps).some((d) => d === name || d.startsWith(`${name}/`));

// shared: zero @pawhaven/* workspace dependencies.
// Source: frontend-architecture §3.3 "@pawhaven/shared → Nothing".
{
  const deps = readPackageDeps('packages/shared');
  if (!deps) {
    failures.push('A1: packages/shared/package.json not found');
  } else {
    for (const dep of Object.keys(deps)) {
      if (dep.startsWith('@pawhaven/')) {
        failures.push(
          `A1: @pawhaven/shared depends on workspace package ${dep} — shared must have zero workspace dependencies (frontend-architecture §3.3)`,
        );
      }
    }
  }
}

// ui: must not depend on @pawhaven/frontend-core.
// Source: frontend-architecture §3.3 FORBIDDEN list.
{
  const deps = readPackageDeps('packages/ui');
  if (deps && workspaceDep(deps, '@pawhaven/frontend-core')) {
    failures.push(
      'A1: @pawhaven/ui depends on @pawhaven/frontend-core — forbidden (frontend-architecture §3.3: pure UI must not depend on the API layer)',
    );
  }
}

// Import-level checks: ui and frontend-core must not import features or apps,
// and apps must not import each other.
const UI_SRC = join(repoRoot, 'packages/ui/src');
const CORE_SRC = join(repoRoot, 'packages/frontend-core/src');
const PORTAL_SRC = join(repoRoot, 'apps/frontend/portal/src');

for (const file of collectSource(UI_SRC, TS_EXTS)) {
  const rel = relative(repoRoot, file);
  const body = readFileSync(file, 'utf8');
  for (const match of body.matchAll(
    /from\s+['"](@pawhaven\/frontend-core[^'"]*|@\/pages\/[^'"]*|apps\/[^'"]*)['"]/g,
  )) {
    failures.push(
      `A1: ${rel}: @pawhaven/ui imports "${match[1]}" — ui must reach only design-system and i18n (frontend-architecture §3.3, §4.2)`,
    );
  }
}

for (const file of collectSource(CORE_SRC, TS_EXTS)) {
  const rel = relative(repoRoot, file);
  const body = readFileSync(file, 'utf8');
  for (const match of body.matchAll(
    /from\s+['"](@\/pages\/[^'"]*|apps\/[^'"]*)['"]/g,
  )) {
    failures.push(
      `A1: ${rel}: @pawhaven/frontend-core imports "${match[1]}" — frontend-core must not reach features or apps (frontend-architecture §4.2)`,
    );
  }
}

// Apps must not import each other. Portal is the only app; a reference to
// another app's tree is a forbidden cross-app import.
for (const file of collectSource(join(repoRoot, 'apps/frontend'), TS_EXTS)) {
  const rel = relative(repoRoot, file);
  if (rel.includes('apps/frontend/portal/')) continue;
  const body = readFileSync(file, 'utf8');
  for (const match of body.matchAll(
    /from\s+['"]([^'"]*apps\/frontend\/(?!portal)[^'"]*)['"]/g,
  )) {
    failures.push(`A1: ${rel}: cross-app import "${match[1]}" — forbidden`);
  }
}

// Backend services import packages only, never each other. A relative import
// that climbs from one service directory into another service directory is
// the violation; intra-service relative imports are fine.
const BACKEND_SERVICES = [
  'gateway',
  'core-service',
  'auth-service',
  'document-service',
];
for (const svc of BACKEND_SERVICES) {
  const svcDir = join(repoRoot, 'apps/backend', svc);
  for (const file of collectSource(svcDir, TS_EXTS)) {
    const rel = relative(repoRoot, file);
    const body = readFileSync(file, 'utf8');
    for (const match of body.matchAll(/from\s+['"](\.[^'"]*)['"]/g)) {
      const resolved = resolve(dirname(file), match[1]);
      const relResolved = relative(join(repoRoot, 'apps/backend'), resolved);
      const targetSvc = relResolved.split('/')[0];
      if (BACKEND_SERVICES.includes(targetSvc) && targetSvc !== svc) {
        failures.push(
          `A1: ${rel}: ${svc} imports from ${targetSvc} (${match[1]}) — backend services import packages only, never each other (service-boundaries §1)`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// A2. Frontend cross-feature value imports.
//
// Source: frontend-architecture §2.3 (P2 "Features are isolated", "Feature A
// → Feature B (any import)"). A value import whose destination sits outside the
// importing page slice is the violation — whether written as `@/pages/X/…` or as
// a relative specifier (`../X/…`), since both resolve to the same place.
// `import type` is allowed — a type is a contract reference, not a runtime
// coupling.
// ---------------------------------------------------------------------------

// Pre-existing cross-page value imports, pinned to importing-page | target-page.
//
// `home|rescue-cases` is the one remaining deviation: Home embeds rescue-cases'
// `RescueCasesSection` through a relative import — the exact form the
// alias-only check used to miss. The section is a widget shared by two pages, so
// the real fix is to lift it (with `CaseCard`/`StatusBadge` and the
// `getStatusColorByPrefix` util it pulls in) into the shared layer
// (packages/frontend-core). Pinned until then, so the deviation is visible
// rather than silently unchecked.
//
// (`rescue-detail|animal-follow` lived here until the `animal-follow` slice was
// folded into `rescue-detail`; `report-animal|auth`, `report-animal|home` and
// `report-animal|rescue-cases` lived here until report-animal was moved onto the
// app-level `@/app/init/currentUser` and `@/shared/constants/sharedQueryKeys`
// registries.)
const A2_ALLOWLIST = new Set([
  'apps/frontend/portal/src/pages/home|rescue-cases',
]);

const FEATURES_DIR = join(repoRoot, 'apps/frontend/portal/src/pages');

// The page slice an import line reaches into, or null when it does not reach
// into any slice. Handles both `@/pages/<slice>/…` and relative specifiers.
function crossPageTarget(file, text) {
  const alias = text.match(/from\s+['"]@\/pages\/([^/'"]+)/);
  if (alias) return alias[1];
  const relSpec = text.match(/from\s+['"](\.[^'"]+)['"]/);
  if (!relSpec) return null;
  const resolved = relative(FEATURES_DIR, resolve(dirname(file), relSpec[1]));
  if (resolved.startsWith('..') || resolved === '') return null;
  return resolved.split('/')[0];
}

if (existsSync(FEATURES_DIR)) {
  for (const feature of readdirSync(FEATURES_DIR, { withFileTypes: true })) {
    if (!feature.isDirectory()) continue;
    const featureName = feature.name;
    const featureDir = join(FEATURES_DIR, featureName);
    for (const file of collectSource(featureDir, TS_EXTS)) {
      const rel = relative(repoRoot, file);
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((text, index) => {
        if (/^\s*import\s+type\b/.test(text)) return;
        const target = crossPageTarget(file, text);
        if (!target || target === featureName) return;
        const key = `${rel.split('/pages/')[0]}/pages/${featureName}|${target}`;
        const shortKey = `apps/frontend/portal/src/pages/${featureName}|${target}`;
        if (A2_ALLOWLIST.has(shortKey) || A2_ALLOWLIST.has(key)) return;
        failures.push(
          `A2: ${rel}:${index + 1}: feature "${featureName}" value-imports from feature "${target}" — cross-feature imports are forbidden (frontend-architecture §2.3); \`import type\` is allowed`,
        );
      });
    }
  }
}

// ---------------------------------------------------------------------------
// A3. Backend cross-module internal imports in core-service.
//
// Source: service-boundaries §5 ("Cross-module imports exist in exactly one
// place"). Only `home` may reach `adoption`/`rescue`, and only through NestJS
// DI (the module import plus the service injection). Anything else is a new
// cross-module path and needs an architecture decision.
// ---------------------------------------------------------------------------

const A3_ALLOWLIST = new Set([
  // home aggregates adoption + rescue reads through NestJS DI. The module
  // half wires AdoptionModule/RescueModule; the service half injects
  // AdoptionService/RescueService. Both halves are one decision.
  'apps/backend/core-service/src/modules/home/home.module.ts|adoption',
  'apps/backend/core-service/src/modules/home/home.module.ts|rescue',
  'apps/backend/core-service/src/modules/home/home.service.ts|adoption',
  'apps/backend/core-service/src/modules/home/home.service.ts|rescue',
]);

const MODULES_DIR = join(repoRoot, 'apps/backend/core-service/src/modules');
if (existsSync(MODULES_DIR)) {
  for (const mod of readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!mod.isDirectory()) continue;
    const modName = mod.name;
    const modDir = join(MODULES_DIR, modName);
    for (const file of collectSource(modDir, TS_EXTS)) {
      if (file.endsWith('.test.ts')) continue;
      const rel = relative(repoRoot, file);
      const body = readFileSync(file, 'utf8');
      for (const match of body.matchAll(/from\s+['"](\.\.\/[^'"]*)['"]/g)) {
        const resolved = resolve(dirname(file), match[1]);
        const relResolved = relative(MODULES_DIR, resolved);
        const targetMod = relResolved.split('/')[0];
        if (!targetMod || targetMod === modName || targetMod === '..') continue;
        const key = `${rel}|${targetMod}`;
        if (A3_ALLOWLIST.has(key)) continue;
        failures.push(
          `A3: ${rel}: module "${modName}" imports from module "${targetMod}" (${match[1]}) — only home → adoption/rescue via DI is allowed (service-boundaries §5)`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// A4. Phantom `apps/frontend/admin` references.
//
// Source: frontend-portal.md ("There is no `apps/frontend/admin`") and
// service-boundaries §9 ("apps/frontend/portal is the only frontend app").
// Only code, config, and scripts are scanned — docs that explain admin does
// not exist are not phantom references.
// ---------------------------------------------------------------------------

const A4_SCOPES = [
  join(repoRoot, 'apps'),
  join(repoRoot, 'packages'),
  join(repoRoot, 'scripts'),
  join(repoRoot, 'package.json'),
  join(repoRoot, 'turbo.json'),
  join(repoRoot, 'pnpm-workspace.yaml'),
];

function walkA4(target, out = []) {
  if (!existsSync(target)) return out;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const full = join(target, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkA4(full, out);
    } else if (
      /\.(ts|tsx|mts|cts|js|mjs|cjs|json|yaml|yml)$/.test(entry.name)
    ) {
      out.push(full);
    }
  }
  return out;
}

function walkFileA4(target, out = []) {
  if (existsSync(target) && /\.(json|yaml|yml)$/.test(target)) out.push(target);
  return out;
}

const a4Files = [];
for (const scope of A4_SCOPES) {
  if (!existsSync(scope)) continue;
  try {
    readdirSync(scope);
    walkA4(scope, a4Files);
  } catch {
    walkFileA4(scope, a4Files);
  }
}

for (const file of a4Files) {
  const rel = relative(repoRoot, file);
  if (rel === 'scripts/check-architecture.mjs') continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((text, index) => {
    if (!/(apps\/frontend\/admin|frontend\/admin)/.test(text)) return;
    failures.push(
      `A4: ${rel}:${index + 1}: phantom admin reference — apps/frontend/portal is the only frontend app (service-boundaries §9)`,
    );
  });
}

// ---------------------------------------------------------------------------
// A5. Portal shared layer must not depend on the app or page layers.
//
// Source: frontend-architecture §2 (Dependencies — a layer reads only the layers
// below it). `src/shared/` is the bottom layer of the portal, so it may reach the
// packages, `src/config`, and itself — never `@/app/**` or `@/pages/**`, whether
// written as an alias or as a relative specifier that climbs out of the slice.
// Shared code that reaches upward is not shared: it is app code wearing a shared
// path, and every layer above it then inherits the coupling.
// ---------------------------------------------------------------------------

const SHARED_SRC = join(repoRoot, 'apps/frontend/portal/src/shared');

if (existsSync(SHARED_SRC)) {
  for (const file of collectSource(SHARED_SRC, TS_EXTS)) {
    const rel = relative(repoRoot, file);
    const body = readFileSync(file, 'utf8');
    for (const match of body.matchAll(
      /from\s+['"](@\/(?:app|pages)\/[^'"]*)['"]/g,
    )) {
      failures.push(
        `A5: ${rel}: shared imports "${match[1]}" — shared is the bottom layer; it must not depend on app or pages (frontend-architecture §2)`,
      );
    }
    for (const match of body.matchAll(/from\s+['"](\.[^'"]*)['"]/g)) {
      const resolved = relative(SHARED_SRC, resolve(dirname(file), match[1]));
      if (!resolved.startsWith('..')) continue;
      failures.push(
        `A5: ${rel}: shared imports "${match[1]}" — resolves outside src/shared; shared is the bottom layer (frontend-architecture §2)`,
      );
    }
  }
}

// ---------------------------------------------------------------------------

if (failures.length > 0) {
  for (const failure of failures) console.error(`fail  ${failure}`);
  process.exit(1);
}

console.log('architecture-check: OK');
