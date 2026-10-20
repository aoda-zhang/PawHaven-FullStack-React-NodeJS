#!/usr/bin/env node
// Markdown link integrity for the documentation tree.
//
// Walks every .md file under a target directory (default: docs), extracts
// relative links and images, and reports targets that do not exist on disk.
// External links (http/https/mailto) and in-document anchors are out of scope;
// anchor-only links are reported separately as "anchor" findings when the
// target file exists but the heading cannot be found.
//
// Usage: node scripts/check-docs-links.mjs [dir ...]
// Exit 0 = no broken links, 1 = at least one broken link.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
]);
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['docs'];

function collectMarkdown(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  if (!statSync(dir).isDirectory()) {
    return dir.endsWith('.md') ? [dir] : out;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...collectMarkdown(join(dir, entry.name)));
    } else if (entry.name.endsWith('.md')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const LINK_PATTERN = /!?\[[^\]]*\]\(([^)]+)\)/g;

// GitHub's anchor algorithm: lowercase, drop everything that is not a letter,
// number, space or hyphen, then turn each space into a hyphen. Two spaces
// therefore become two hyphens.
const slugify = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');

const anchorsOf = (markdown) => {
  const anchors = new Set();
  for (const line of markdown.split('\n')) {
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    if (heading) anchors.add(slugify(heading[1]));
  }
  return anchors;
};

const findings = [];
let checked = 0;

for (const target of targets) {
  const root = resolve(repoRoot, target);
  for (const file of collectMarkdown(root)) {
    const markdown = readFileSync(file, 'utf8');
    const anchors = anchorsOf(markdown);
    for (const match of markdown.matchAll(LINK_PATTERN)) {
      const raw = match[1].trim();
      if (!raw || raw.startsWith('#')) continue;
      if (/^(https?:|mailto:|tel:|data:)/i.test(raw)) continue;
      const [pathPart, anchorPart] = raw.split('#');
      if (!pathPart) continue;
      const decoded = decodeURIComponent(pathPart);
      const absolute = resolve(dirname(file), decoded);
      checked += 1;
      if (!existsSync(absolute)) {
        findings.push({
          file: relative(repoRoot, file),
          line: markdown.slice(0, match.index).split('\n').length,
          target: raw,
          kind: 'missing-target',
        });
        continue;
      }
      if (anchorPart && statSync(absolute).isFile()) {
        const targetAnchors = anchorsOf(readFileSync(absolute, 'utf8'));
        if (!targetAnchors.has(slugify(decodeURIComponent(anchorPart)))) {
          findings.push({
            file: relative(repoRoot, file),
            line: markdown.slice(0, match.index).split('\n').length,
            target: raw,
            kind: 'missing-anchor',
          });
        }
      }
    }
  }
}

if (findings.length === 0) {
  console.log(
    `OK: ${checked} relative link(s) checked across ${targets.join(', ')}. No broken links.`,
  );
  process.exit(0);
}

for (const finding of findings) {
  console.log(
    `${finding.kind}\t${finding.file}:${finding.line}\t${finding.target}`,
  );
}
console.log(
  `\n${findings.length} broken link(s) across ${checked} checked relative link(s).`,
);
process.exit(1);
