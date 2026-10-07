#!/usr/bin/env node
// Repository quality scan for PawHaven — mechanical health only. No judgement, no scores,
// no grades, no eval corpus (plan §24–§26). Run via `pnpm quality-check`.
// Exit 0 = clean (warnings allowed), 1 = finding.
//
// What this check owns:
//   1. Orphaned docs — a docs/**/*.md file that no entry point reaches.
//   2. Stale paths — a live reference to a resource this refactor retired.
//   3. Duplicate-rule candidates — the same normative line in two or more files (§27 drift
//      risk). Warning-only: the detector cannot tell a restatement from a reference, so a
//      human decides every candidate.
//
// What it deliberately does NOT own — delegation, not duplication:
//   - Architecture violations: `pnpm architecture-check` owns them; it is invoked below as a
//     subprocess and its exit status is folded into this run's.
//   - Link integrity: `pnpm check:links` owns it; invoked below for the same reason.
//   - Harness/skill integrity: `pnpm pi-check` owns it — named as owner here, not reimplemented,
//     because it needs the pi runtime and is already wired into the harness workflow.
//   - Design tokens: `pnpm token-check` owns them — a different domain, named as owner here.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
const warnings = [];

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  'npm',
]);

function collectFiles(target, exts) {
  const full = join(repoRoot, target);
  if (!existsSync(full)) return [];
  try {
    if (!statSync(full).isDirectory()) {
      return exts.some((ext) => target.endsWith(ext)) ? [target] : [];
    }
  } catch {
    return [];
  }
  const out = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...collectFiles(join(target, entry.name), exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(join(target, entry.name));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. Orphaned docs.
//
// Reachability definition: a docs/**/*.md file is reachable if one of the entry
// points — the two declared doc indexes (docs/README.md, docs/README.cn.md) and
// the four top-level maps (README.md, README.cn.md, AGENTS.md, .pi/README.md) —
// links to it, transitively, through markdown links. The indexes are roots
// because they declare themselves the entry point ("Unified entry point for
// all project documentation"); the maps are roots because they are where a
// reader lands first. A definition with no roots reports everything as
// orphaned; a definition where every file is its own root reports nothing.
// This list is the calibrated middle — the V2 validator proves it fires.
//
// Why it matters: docs/ is the project's knowledge source of truth (plan §27).
// A doc nothing reaches is undiscoverable — no agent finds it, so it drifts
// from the code it describes and becomes misinformation.
// ---------------------------------------------------------------------------

const DOC_ENTRY_POINTS = [
  'docs/README.md',
  'docs/README.cn.md',
  'README.md',
  'README.cn.md',
  'AGENTS.md',
  '.pi/README.md',
];

const MD_LINK = /\]\(([^)\s]+)\)/g;
const EXTERNAL = /^(?:https?:|mailto:|tel:|data:)/;

function docLinkTargets(fromFile, body) {
  const out = [];
  for (const match of body.matchAll(MD_LINK)) {
    const target = match[1].split('#')[0];
    if (!target || EXTERNAL.test(target)) continue;
    const resolved = resolve(dirname(fromFile), target);
    if (resolved.endsWith('.md') && existsSync(resolved)) out.push(resolved);
  }
  return out;
}

{
  const allDocs = collectFiles('docs', ['.md']).map((f) =>
    resolve(join(repoRoot, f)),
  );
  const reachable = new Set();
  const queue = [];

  for (const entry of DOC_ENTRY_POINTS) {
    const file = join(repoRoot, entry);
    if (!existsSync(file)) {
      findings.push(
        `orphan-scan: entry point ${entry} is missing — the doc map is gone`,
      );
      continue;
    }
    reachable.add(file);
    for (const target of docLinkTargets(file, readFileSync(file, 'utf8'))) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  while (queue.length > 0) {
    const file = queue.shift();
    for (const target of docLinkTargets(file, readFileSync(file, 'utf8'))) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }

  const orphans = allDocs.filter((doc) => !reachable.has(doc));
  for (const orphan of orphans) {
    findings.push(
      `orphan  ${relative(repoRoot, orphan)} — unreachable: no entry point ` +
        `(${DOC_ENTRY_POINTS.join(', ')}) links to it, transitively, through markdown links. ` +
        `A doc nothing reaches is undiscoverable, so it drifts — link it from the index that covers its area.`,
    );
  }
  console.log(
    `orphaned docs: ${allDocs.length} scanned, ${orphans.length} orphaned`,
  );
}

// ---------------------------------------------------------------------------
// 2. Stale paths — live references to retired resources.
//
// The retired set is what this refactor deleted: the `project-rules` and
// `frontend` skills, the `handoffs` layer, the `.opencode/` harness, and the
// `new-feature.md` workflow. `.codebuddy/` is included because it was retired
// in the same wave and every mention of it is framed the same way. A pattern
// that exists again is skipped — a restored directory is not stale.
//
// Live vs historical: a mention is historical when its own line, or the
// nearest heading above it, frames it as past ("retired", "deleted",
// "moved to", …). The classifier deliberately errs toward "historical": a
// live pointer phrased in past tense can be missed (false negative), but
// prose that is right never fails the run (no false positive). A check that
// fails on correct prose trains people to suppress it.
// ---------------------------------------------------------------------------

const RETIRED_PATHS = [
  '.pi/skills/project-rules/',
  '.pi/skills/frontend/',
  '.pi/handoffs/',
  '.opencode/',
  '.codebuddy/',
  'new-feature.md',
];

const PAST_TENSE_MARKERS = [
  'retired',
  'retire',
  'deleted',
  'delete',
  'gone',
  'dead',
  'legacy',
  'dissolved',
  'obsolete',
  'no longer',
  'never existed',
  'does not exist',
  'used to live',
  'used to',
  'previous',
  'old',
  'earlier version',
  'disagreed',
  'was wrong',
  'false',
  'asserted',
  'specified',
  'said',
  'superseded',
  'deprecated',
  'formerly',
  'has been',
  'was a',
  'were',
  'instead',
  'now lives',
  'now in',
  'moved to',
  'replaced',
  'preceded',
  '退役',
  '已删',
  '删除',
  '死链',
  '废弃',
];

const STALE_SCOPES = [
  '.pi',
  'AGENTS.md',
  'docs',
  'README.md',
  'README.cn.md',
  'scripts',
  'package.json',
  'turbo.json',
  'pnpm-workspace.yaml',
];

{
  const staleFiles = [
    ...new Set(
      STALE_SCOPES.flatMap((scope) =>
        collectFiles(scope, [
          '.md',
          '.mjs',
          '.cjs',
          '.json',
          '.yaml',
          '.yml',
          '.ts',
          '.tsx',
          '.sh',
        ]),
      ),
    ),
  ];
  const live = [];
  let historical = 0;

  for (const rel of staleFiles) {
    // This script's own pattern list contains the retired paths as string literals. Data is
    // not an instruction — a reader cannot copy-and-run it — so the scan excludes this file,
    // the same way check-architecture.mjs excludes itself from its A4/A5 scans.
    if (rel === 'scripts/check-quality.mjs') continue;
    const lines = readFileSync(join(repoRoot, rel), 'utf8').split('\n');
    let heading = '';
    let inCodeBlock = false;
    lines.forEach((text, index) => {
      if (/^\s*```/.test(text)) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      if (!inCodeBlock) {
        const headingMatch = text.match(/^#{1,6}\s+(.*)$/);
        if (headingMatch) heading = headingMatch[1];
      }
      for (const pattern of RETIRED_PATHS) {
        if (existsSync(join(repoRoot, pattern))) continue;
        if (!text.includes(pattern)) continue;
        const framed = PAST_TENSE_MARKERS.some((marker) =>
          `${text} ${heading}`.toLowerCase().includes(marker),
        );
        if (framed) {
          historical += 1;
        } else {
          live.push(
            `stale  ${rel}:${index + 1}: live reference to retired resource "${pattern}" — ` +
              `a path a reader would copy and run. If the mention is historical, frame it in past ` +
              `tense on the same line or in the section heading ("retired", "deleted", "moved to").`,
          );
        }
      }
    });
  }

  findings.push(...live);
  console.log(
    `stale paths: ${historical} historical mentions, ${live.length} live references`,
  );
}

// ---------------------------------------------------------------------------
// 3. Duplicate-rule candidates (§27 drift risk) — warnings only.
//
// Signal: a normalized line — lowercased, markdown syntax stripped, whitespace
// collapsed — that (a) reads as a rule (contains a normative keyword), (b) is at
// least 30 characters, (c) is not inside a fenced code block, a table row, or
// an XML-ish template line, and (d) appears in two or more distinct files under
// .pi/, AGENTS.md, or docs/. The same rule asserted in two places drifts; the
// same code snippet or index row in two places does not, which is why the
// signal is normative lines only. Measured on this tree: 2 candidates, both
// genuine cross-file duplications. Warning-only because the detector cannot
// tell "restates the rule" from "points at the rule's source" — both are
// candidates for a human to decide, and a noisy detector gets suppressed.
// ---------------------------------------------------------------------------

const NORMATIVE =
  /\b(must not|must|do not|don't|never|always|required|require|forbidden|prohibited|shall|no agent|every agent|only)\b|禁止|必须|不得|不要|只能|不应/;

const normalizeLine = (line) =>
  line
    .toLowerCase()
    .replace(/^[#>\s]*(?:[-*+]|\d+\.)\s+/, '')
    .replace(/[*_`]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

{
  const dupFiles = [
    ...new Set(
      ['.pi', 'AGENTS.md', 'docs'].flatMap((scope) =>
        collectFiles(scope, ['.md']),
      ),
    ),
  ];
  const MIN_LEN = 30;
  const seen = new Map();

  for (const rel of dupFiles) {
    const lines = readFileSync(join(repoRoot, rel), 'utf8').split('\n');
    let inCodeBlock = false;
    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      if (/^\s*\|/.test(line)) continue;
      if (/^\s*</.test(line)) continue;
      if (!NORMATIVE.test(line)) continue;
      const normalized = normalizeLine(line);
      if (normalized.length < MIN_LEN) continue;
      if (!/[a-z一-鿿]/.test(normalized)) continue;
      if (!seen.has(normalized)) seen.set(normalized, new Set());
      seen.get(normalized).add(rel);
    }
  }

  const candidates = [...seen.entries()].filter(([, files]) => files.size >= 2);
  for (const [line, files] of candidates) {
    warnings.push(
      `duplicate-rule candidate (${files.size} files): "${line}" — ${[...files].sort().join(', ')}`,
    );
  }
  console.log(
    `duplicate-rule candidates: ${candidates.length} (warnings only, scanned ${dupFiles.length} files)`,
  );
}

// ---------------------------------------------------------------------------
// 4. Delegation — invoke the owners, fold their exit status into this run.
// ---------------------------------------------------------------------------

const DELEGATED = [
  {
    name: 'architecture-check',
    args: [join(repoRoot, 'scripts/check-architecture.mjs')],
    owns: 'package/feature/service boundaries',
  },
  {
    name: 'check:links',
    args: [join(repoRoot, 'scripts/check-md-links.mjs'), repoRoot],
    owns: 'markdown links and anchors',
  },
];

for (const { name, args, owns } of DELEGATED) {
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(`${name}: OK — owns ${owns}`);
  } else {
    findings.push(`${name}: FAILED (exit ${result.status}) — owns ${owns}`);
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
    if (output) console.error(output);
  }
}

console.log(
  'owners not reimplemented here: pi-check — harness/skill integrity; token-check — design tokens',
);

// ---------------------------------------------------------------------------

for (const warning of warnings) console.warn(`warn  ${warning}`);
for (const finding of findings) console.error(`fail  ${finding}`);

if (findings.length > 0) {
  console.error(`quality-check: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log('quality-check: OK');
