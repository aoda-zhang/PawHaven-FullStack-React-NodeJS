const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');

const { checkTokenContract } = require('./token-contract.cjs');

function analyzeFixture(css) {
  const root = mkdtempSync(join(tmpdir(), 'pawhaven-token-contract-'));
  const file = join(root, 'tokens.css');
  writeFileSync(file, css, 'utf8');

  try {
    return checkTokenContract({ repoRoot: root, sourceFiles: [file] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('accepts valid token definitions and aliases', () => {
  const failures = analyzeFixture(`:root {
  --color-primary: #fff;
  --color-action: var(--color-primary);
  color: var(--color-action);
}`);

  assert.deepEqual(failures, []);
});

test('rejects references to undefined CSS variables', () => {
  const failures = analyzeFixture(`:root {
  --color-action: var(--color-missing);
}`);

  assert.ok(
    failures.some((failure) => failure.includes('undefined CSS variable --color-missing')),
  );
});

test('rejects circular token aliases', () => {
  const failures = analyzeFixture(`:root {
  --color-a: var(--color-b);
  --color-b: var(--color-a);
}`);

  assert.ok(
    failures.some((failure) => failure.includes('circular token alias')),
  );
});
