#!/usr/bin/env node
// Resolves every relative markdown link in the harness, AGENTS.md, and docs:
//   ./x, ../x        dot-prefixed paths, resolved from the containing file
//   references/x.md  bare sibling and child paths, resolved from the containing file too
//   #anchor          same-file anchors, resolved against the containing file's own headings
// Slug rules follow GitHub: lowercase, drop punctuation, turn each space into a hyphen.
// Runs of spaces are NOT collapsed, so `State access — the real names` keeps its double hyphen.
// Exit 1 when anything is broken that is not listed in KNOWN_BROKEN.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const repoRoot = resolve(process.argv[2] ?? '.');
const ROOTS = ['.pi', 'AGENTS.md', 'docs', 'README.md', 'README.cn.md'];
const SKIP_DIRS = new Set(['npm', 'handoffs', 'node_modules', 'dist', 'build']);

// Findings this check reports but deliberately does not fail on, keyed by the same
// `<file> -> <raw target>` string the report prints. Each one was measured against ROOTS with
// this script, and each is a defect someone has decided not to repair inside the change that
// widened the check's scope — `docs/` is out of scope for that change, so its findings are
// listed here instead of being fixed in passing. Same pattern as the 13 known errors
// `pnpm lint` already carries. Anything NOT listed here still fails the run, including a new
// break under `docs/`: add an entry deliberately, in the change that owns the defect.
const KNOWN_BROKEN = [];

const slug = (text) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/ /g, '-');

const anchorsOf = (file) => {
  const body = readFileSync(file, 'utf8');
  return new Set(
    [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1])),
  );
};

const collect = (target) => {
  const full = join(repoRoot, target);
  if (!existsSync(full)) return [];
  if (!statSync(full).isDirectory()) return full.endsWith('.md') ? [full] : [];
  const out = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    out.push(...collect(join(target, entry.name)));
  }
  return out;
};

const EXTERNAL = /^(?:https?:|mailto:|tel:|data:)/;
// Everything between `](` and the closing paren. Matches dot-prefixed paths, bare sibling and
// child paths, and same-file anchors in one pass, so widening the scope cannot mean adding a
// second, differently-shaped pattern later.
const LINK = /\]\(([^)\s]+)\)/g;

const files = ROOTS.flatMap(collect);
const anchorCache = new Map();
const broken = [];
const baselined = [];
let examined = 0;

const anchorsFor = (file) => {
  if (!anchorCache.has(file)) anchorCache.set(file, anchorsOf(file));
  return anchorCache.get(file);
};

for (const file of files) {
  const body = readFileSync(file, 'utf8');
  const where = relative(repoRoot, file);
  for (const match of body.matchAll(LINK)) {
    const raw = match[1];
    // An absolute URL names something this check cannot see and must not resolve as a path.
    if (EXTERNAL.test(raw)) continue;

    const hash = raw.indexOf('#');
    const path = hash === -1 ? raw : raw.slice(0, hash);
    const anchor = hash === -1 ? '' : raw.slice(hash + 1);
    // A bare `#` points at the top of the file, which is always present; there is nothing to check.
    if (!path && !anchor) continue;

    examined += 1;
    // A same-file anchor resolves against the containing file's own headings; an empty path
    // with an anchor means the link stayed in this file.
    const target = resolve(dirname(file), path || file);
    const finding = existsSync(target)
      ? anchor && !anchorsFor(target).has(anchor)
        ? `${where} -> ${raw} [anchor missing]`
        : ''
      : `${where} -> ${raw} [target missing]`;
    if (!finding) continue;
    (KNOWN_BROKEN.includes(finding) ? baselined : broken).push(finding);
  }
}

// A listed entry that matched nothing: the defect behind it was repaired and the entry was left
// behind, where it would go on suppressing the next break at the same site.
const staleBaseline = KNOWN_BROKEN.filter(
  (entry) => !baselined.includes(entry),
);

console.log(
  `scanned ${files.length} files, examined ${examined} links, ` +
    `${broken.length} broken, ${baselined.length} baselined, ` +
    `${staleBaseline.length} stale baseline entries`,
);
for (const b of broken) console.log(`  BROKEN ${b}`);
for (const b of baselined) console.log(`  BASELINE ${b}`);
for (const s of staleBaseline) console.log(`  STALE ${s}`);
process.exit(broken.length ? 1 : 0);
