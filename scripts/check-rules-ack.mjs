#!/usr/bin/env node
// Commit gate: a commit message must carry the hash of the ruleset it was written
// under, so the rules are acknowledged in the same act that records the change.
// Run via the Husky `commit-msg` hook, which passes the COMMIT_EDITMSG path as $1.
// Exit 0 = trailer present and current, 1 = missing or stale.
//
// The message source, in order: the path given as the first argument, the
// COMMIT_EDITMSG environment variable, then stdin. The hook supplies the first,
// so a human can run this against a message file or pipe one in.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RULES = 'docs/context/agent-constraints.md';
const TRAILER = /^Rules-ACK: ([0-9a-f]{64})$/m;

function fail(problem) {
  console.error(`rules-ack: ${problem}\n`);
  console.error(`  Read ${RULES}, then add one line to the commit message:`);
  console.error('');
  console.error('    Rules-ACK: <hash>\n');
  console.error('  The hash is the sha256 of the rules file. Compute it with:');
  console.error('');
  console.error(`    shasum -a 256 ${RULES} | cut -d' ' -f1\n`);
  process.exit(1);
}

function readMessage() {
  for (const path of [process.argv[2], process.env.COMMIT_EDITMSG]) {
    if (path && existsSync(path)) return readFileSync(path, 'utf8');
  }
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const rulesPath = join(repoRoot, RULES);
if (!existsSync(rulesPath))
  fail(`${RULES} is missing, so its hash cannot be acknowledged.`);
const expected = createHash('sha256')
  .update(readFileSync(rulesPath))
  .digest('hex');

const message = readMessage();
const trailer = message.match(TRAILER);
if (!trailer) {
  fail('the commit message has no "Rules-ACK: <64-character hex>" trailer.');
}
if (trailer[1] !== expected) {
  fail(
    `the Rules-ACK trailer is stale. It records ${trailer[1]}, the current hash is ${expected}.`,
  );
}
console.log(`rules-ack: OK — ${expected}`);
