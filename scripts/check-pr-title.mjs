#!/usr/bin/env node
/**
 * Validates a pull request title against the same rule commitlint enforces on commits:
 * `[PW-<issue>] <type>(<scope>): <subject>`.
 *
 * The title is what lands in `main`'s history for a squash merge, so it has to satisfy the same
 * contract as a commit message. Keeping the check here — not in a third-party review bot — makes it
 * deterministic, instant, and part of the single `Gate` check.
 *
 * Usage: node scripts/check-pr-title.mjs "<title>"
 *        PR_TITLE="<title>" node scripts/check-pr-title.mjs
 * Exit 0 = valid, 1 = invalid.
 */
const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'chore',
];
const HEADER_MAX_LENGTH = 100;
const SUBJECT_MIN_LENGTH = 5;

const PATTERN =
  /^\[(PW-\d+)\] (feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?: (.+)$/;

const EXPECTED =
  '[PW-<issue>] <type>(<scope>): <subject> — for example "[PW-193] fix(ci): Accept the forced NODE_ENV value"';

const title = (process.argv[2] ?? process.env.PR_TITLE ?? '').trim();

const fail = (reason) => {
  console.error(`PR title is invalid: ${reason}`);
  console.error(`  expected: ${EXPECTED}`);
  console.error(`  allowed types: ${TYPES.join(', ')}`);
  process.exit(1);
};

if (!title) {
  fail('the title is empty');
}

const match = PATTERN.exec(title);
if (!match) {
  fail('it does not match the required format');
}

const subject = match[4].trim();
if (subject.length < SUBJECT_MIN_LENGTH) {
  fail(`the subject needs at least ${SUBJECT_MIN_LENGTH} characters`);
}

if (title.length > HEADER_MAX_LENGTH) {
  fail(`the title exceeds ${HEADER_MAX_LENGTH} characters (${title.length})`);
}

console.log(`PR title is valid: ${title}`);
