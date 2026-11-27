/* eslint-disable no-magic-numbers */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_TTLS,
  MESSAGES,
  MAX_TTLS,
  evaluatePermission,
  grantStatus,
  parseCommitCommand,
} from './policy.mjs';

const PROJECT_ROOT = '/repo/project';
const NOW = 1_800_000_000_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

function emptyGrants(overrides = {}) {
  return { commit: null, ...overrides };
}

function commitGrant(overrides = {}) {
  return {
    note: 'flow-gate WU-1',
    grantedAt: NOW,
    expiresAt: NOW + HOUR_MS,
    ...overrides,
  };
}

function checkEdit(
  resources,
  grants = emptyGrants(),
  projectRoot = PROJECT_ROOT,
) {
  return evaluatePermission({
    action: 'edit',
    resources,
    projectRoot,
    now: NOW,
    grants,
  });
}

function checkShell(command, grants = emptyGrants()) {
  return evaluatePermission({
    action: 'shell',
    resources: [command],
    projectRoot: PROJECT_ROOT,
    now: NOW,
    grants,
  });
}

function assertRoutingMessage(result, command, mentionImplementer) {
  assert.equal(result.effect, 'deny');
  assert.match(result.message, new RegExp(command));
  assert.match(result.message, /do not retry/i);
  assert.match(result.message, /do not work around this with shell/i);
  if (mentionImplementer) {
    assert.match(result.message, /implementer/);
  }
}

function assertEditDeny(result, message) {
  assert.equal(result.effect, 'deny');
  assert.equal(result.message, message);
  assert.match(result.message, /do not retry/i);
  assert.match(result.message, /do not work around this with shell/i);
}

test('an ordinary edit inside the project passes to the agent permission rules', () => {
  assert.deepEqual(checkEdit(['src/app.ts']), { effect: 'pass' });
});

test('a set of project edits passes without a grant', () => {
  assert.deepEqual(checkEdit(['src/app.ts', 'docs/context/agent.md']), {
    effect: 'pass',
  });
});

test('edit under .git is denied', () => {
  const result = checkEdit(['.git/hooks/pre-commit']);
  assertEditDeny(result, MESSAGES.editInGitDir);
  assert.match(result.message, /\.git\//);
});

test('edit under a nested .git directory is denied', () => {
  const result = checkEdit(['vendor/pkg/.git/config']);
  assertEditDeny(result, MESSAGES.editInGitDir);
});

test('edit outside the project root is denied', () => {
  const result = checkEdit(['/repo/elsewhere/app.ts']);
  assertEditDeny(result, MESSAGES.editOutsideProject);
  assert.match(result.message, /implementer/);
});

test('edit escaping the project root with .. segments is denied', () => {
  const result = checkEdit(['src/../../elsewhere/app.ts']);
  assertEditDeny(result, MESSAGES.editOutsideProject);
});

test('edit with an empty project root is denied as a safe default', () => {
  const result = checkEdit(['src/app.ts'], emptyGrants(), '');
  assertEditDeny(result, MESSAGES.editOutsideProject);
});

test('a commit grant does not change any edit result', () => {
  const resources = ['src/app.ts', '/repo/elsewhere/app.ts', '.git/config'];
  const without = resources.map((resource) => checkEdit([resource]));
  const withGrant = resources.map((resource) =>
    checkEdit([resource], emptyGrants({ commit: commitGrant() })),
  );
  assert.deepEqual(withGrant, without);
  assert.deepEqual(without[0], { effect: 'pass' });
  assert.equal(without[1].effect, 'deny');
  assert.equal(without[2].effect, 'deny');
});

test('edit with Windows backslashes resolves inside a Windows project root', () => {
  const result = checkEdit(
    ['C:\\repo\\project\\src\\app.ts'],
    emptyGrants(),
    'C:\\repo\\project',
  );
  assert.deepEqual(result, { effect: 'pass' });
});

test('edit with a trailing slash on the project root resolves inside', () => {
  const result = checkEdit(
    ['/repo/project/src/app.ts'],
    emptyGrants(),
    '/repo/project/',
  );
  assert.deepEqual(result, { effect: 'pass' });
});

test('no denial message mentions /approve-plan', () => {
  Object.values(MESSAGES).forEach((message) => {
    assert.doesNotMatch(message, /approve-plan/);
  });
});

test('read-only git status, diff and log are allowed', () => {
  ['git status', 'git diff', 'git log --oneline -5', 'git diff --stat'].forEach(
    (command) => {
      assert.deepEqual(checkShell(command), { effect: 'allow' });
    },
  );
});

test('git branch listing is read-only and allowed', () => {
  ['git branch', 'git branch --list', 'git branch -a'].forEach((command) => {
    assert.deepEqual(checkShell(command), { effect: 'allow' });
  });
});

test('git branch new-name is publishing and is denied without a commit grant', () => {
  const result = checkShell('git branch new-name');
  assert.equal(result.message, MESSAGES.commitRequired);
  assertRoutingMessage(result, '/approve-commit', false);
});

test('git branch new-name is allowed with an active commit grant', () => {
  const grants = emptyGrants({ commit: commitGrant() });
  assert.deepEqual(checkShell('git branch new-name', grants), {
    effect: 'allow',
  });
});

test('git commit through a compound resource is gated by the commit grant', () => {
  const command = 'cd . && git commit -m "test"';
  assert.equal(checkShell(command).message, MESSAGES.commitRequired);
  const grants = emptyGrants({ commit: commitGrant() });
  assert.deepEqual(checkShell(command, grants), { effect: 'allow' });
});

test('git commit quoted inside sh -c is gated by the commit grant', () => {
  const command = 'sh -c "git commit -m test"';
  assert.equal(checkShell(command).message, MESSAGES.commitRequired);
  const grants = emptyGrants({ commit: commitGrant() });
  assert.deepEqual(checkShell(command, grants), { effect: 'allow' });
});

test('git commit reached through xargs is gated by the commit grant', () => {
  const command = 'printf x | xargs git commit -m test';
  assert.equal(checkShell(command).message, MESSAGES.commitRequired);
});

test('gh pr create, merge and edit are gated by the commit grant', () => {
  ['gh pr create --fill', 'gh pr merge 12', 'gh pr edit 12 --title x'].forEach(
    (command) => {
      assert.equal(checkShell(command).message, MESSAGES.commitRequired);
      const grants = emptyGrants({ commit: commitGrant() });
      assert.deepEqual(checkShell(command, grants), { effect: 'allow' });
    },
  );
});

test('gh pr view is not a publishing subcommand and passes', () => {
  assert.deepEqual(checkShell('gh pr view 12'), { effect: 'pass' });
});

test('git -c is denied as a dangerous flag even with a commit grant', () => {
  const command = 'git -c core.hooksPath=/tmp/hooks commit -m test';
  const grants = emptyGrants({ commit: commitGrant() });
  const result = checkShell(command, grants);
  assert.equal(result.message, MESSAGES.dangerousFlag);
  assertRoutingMessage(result, '/approve-commit', false);
});

test('git diff --output= is denied as a dangerous flag', () => {
  const result = checkShell('git diff --output=/tmp/out.diff');
  assert.equal(result.message, MESSAGES.dangerousFlag);
});

test('git diff --ext-diff is denied as a dangerous flag', () => {
  const result = checkShell('git diff --ext-diff');
  assert.equal(result.message, MESSAGES.dangerousFlag);
});

test('git ci is an unknown verb and is denied', () => {
  const result = checkShell('git ci -m test');
  assert.equal(result.message, MESSAGES.unknownGitVerb);
  assertRoutingMessage(result, 'run the command themselves', false);
});

test('opencode run is denied as a nested runtime', () => {
  const result = checkShell('opencode run -m x "hello"');
  assert.equal(result.message, MESSAGES.nestedRuntime);
});

test('npx opencode is denied as a nested runtime', () => {
  const result = checkShell('npx opencode');
  assert.equal(result.message, MESSAGES.nestedRuntime);
});

test('pnpm exec opencode serve is denied as a nested runtime', () => {
  const result = checkShell('pnpm exec opencode serve');
  assert.equal(result.message, MESSAGES.nestedRuntime);
});

test('redirecting into .git/hooks is denied', () => {
  const result = checkShell('echo x > .git/hooks/pre-commit');
  assert.equal(result.message, MESSAGES.gitDirWrite);
});

test('copying a file into .git is denied', () => {
  const result = checkShell('cp src/hook.sh .git/hooks/pre-commit');
  assert.equal(result.message, MESSAGES.gitDirWrite);
});

test('destructive git verbs are denied', () => {
  [
    'git reset --hard HEAD',
    'git rebase main',
    'git revert HEAD',
    'git cherry-pick abc123',
    'git clean -fd',
    'git restore src/app.ts',
    'git update-ref refs/heads/x HEAD',
    'git filter-branch --tree-filter true',
    'git reflog expire --expire=now --all',
    'git branch -D old-branch',
    'git branch -m renamed',
    'git stash drop',
  ].forEach((command) => {
    assert.equal(checkShell(command).message, MESSAGES.destructive);
  });
});

test('git checkout -- file is denied as destructive', () => {
  const result = checkShell('git checkout -- src/app.ts');
  assert.equal(result.message, MESSAGES.destructive);
});

test('git checkout main is denied as destructive (choice: every checkout can rewrite the worktree)', () => {
  const result = checkShell('git checkout main');
  assert.equal(result.message, MESSAGES.destructive);
});

test('rm and mv are denied as destructive shell commands', () => {
  ['rm -rf dist', 'mv a.ts b.ts'].forEach((command) => {
    assert.equal(checkShell(command).message, MESSAGES.destructive);
  });
});

test('unclassified commands pass untouched', () => {
  [
    'pnpm exec prettier --check .',
    'ls -la',
    'node --test policy.test.mjs',
  ].forEach((command) => {
    assert.deepEqual(checkShell(command), { effect: 'pass' });
  });
});

test('a message mentioning git is not treated as a git command', () => {
  assert.deepEqual(checkShell('echo "git commit"'), { effect: 'pass' });
});

test('deny wins over allow across resources', () => {
  const grants = emptyGrants({ commit: commitGrant() });
  const result = evaluatePermission({
    action: 'shell',
    resources: ['git status', 'git commit -m test', 'git reset --hard'],
    projectRoot: PROJECT_ROOT,
    now: NOW,
    grants,
  });
  assert.equal(result.message, MESSAGES.destructive);
});

test('publishing without a grant denies a mixed read and publish resource set', () => {
  const result = evaluatePermission({
    action: 'shell',
    resources: ['git status', 'git commit -m test'],
    projectRoot: PROJECT_ROOT,
    now: NOW,
    grants: emptyGrants(),
  });
  assert.equal(result.message, MESSAGES.commitRequired);
});

test('publishing with a commit grant allows a mixed read and publish resource set', () => {
  const grants = emptyGrants({ commit: commitGrant() });
  const result = evaluatePermission({
    action: 'shell',
    resources: ['git status', 'git commit -m test'],
    projectRoot: PROJECT_ROOT,
    now: NOW,
    grants,
  });
  assert.deepEqual(result, { effect: 'allow' });
});

test('unclassified actions pass untouched', () => {
  ['read', 'glob', 'grep', 'webfetch', 'subagent'].forEach((action) => {
    const result = evaluatePermission({
      action,
      resources: ['anything'],
      projectRoot: PROJECT_ROOT,
      now: NOW,
      grants: emptyGrants(),
    });
    assert.deepEqual(result, { effect: 'pass' });
  });
});

test('grantStatus reports a missing grant as inactive without an expiry', () => {
  assert.deepEqual(grantStatus(null, NOW), { active: false });
  assert.deepEqual(grantStatus(undefined, NOW), { active: false });
});

test('grantStatus is active before expiry and expired exactly at expiry', () => {
  const grant = commitGrant();
  assert.deepEqual(grantStatus(grant, NOW), {
    active: true,
    expiresAt: NOW + HOUR_MS,
  });
  assert.deepEqual(grantStatus(grant, NOW + HOUR_MS), {
    active: false,
    expiresAt: NOW + HOUR_MS,
  });
});

test('/approve-commit with no arguments grants the default commit ttl', () => {
  const result = parseCommitCommand({ text: '', now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.action, 'grant');
  assert.equal(result.grant.note, '');
  assert.equal(result.grant.grantedAt, NOW);
  assert.equal(
    result.grant.expiresAt,
    NOW + DEFAULT_TTLS.commitMinutes * MINUTE_MS,
  );
});

test('/approve-commit honours a custom minute ttl and note', () => {
  const result = parseCommitCommand({
    text: '15 WU-1 policy and tests',
    now: NOW,
  });
  assert.equal(result.ok, true);
  assert.equal(result.grant.note, 'WU-1 policy and tests');
  assert.equal(result.grant.expiresAt, NOW + 15 * MINUTE_MS);
});

test('/approve-commit honours an hour ttl', () => {
  const result = parseCommitCommand({ text: '2h', now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.grant.expiresAt, NOW + 120 * MINUTE_MS);
});

test('/approve-commit refuses a zero ttl', () => {
  const result = parseCommitCommand({ text: '0', now: NOW });
  assert.equal(result.ok, false);
  assert.match(result.reason, /at least 1 minute/);
  assert.match(result.usage, /\/approve-commit/);
});

test('/approve-commit refuses a ttl above the commit maximum', () => {
  const result = parseCommitCommand({
    text: String(MAX_TTLS.commitMinutes + 1),
    now: NOW,
  });
  assert.equal(result.ok, false);
  assert.match(result.reason, new RegExp(String(MAX_TTLS.commitMinutes)));
  assert.match(result.usage, /\/approve-commit/);
});

test('/approve-commit refuses a fractional ttl', () => {
  const result = parseCommitCommand({ text: '1.5h', now: NOW });
  assert.equal(result.ok, false);
  assert.match(result.reason, /whole number/);
});

test('revoke with trailing tokens is refused', () => {
  ['revoke now', 'status now'].forEach((text) => {
    const result = parseCommitCommand({ text, now: NOW });
    assert.equal(result.ok, false);
    assert.match(result.reason, /takes no arguments/);
  });
});

test('revoke and status alone succeed without a grant', () => {
  const revoke = parseCommitCommand({ text: 'revoke', now: NOW });
  assert.deepEqual(revoke, { ok: true, action: 'revoke', grant: null });
  const status = parseCommitCommand({ text: 'status', now: NOW });
  assert.deepEqual(status, { ok: true, action: 'status', grant: null });
});

test('an unbounded wildcard note is refused, case-insensitively', () => {
  ['*', 'ALL', 'any', 'everything'].forEach((note) => {
    const result = parseCommitCommand({ text: note, now: NOW });
    assert.equal(result.ok, false);
    assert.match(result.reason, /must name the change/);
  });
});

test('a note that names a path is accepted', () => {
  const result = parseCommitCommand({ text: 'src/*', now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.grant.note, 'src/*');
});

test('a note longer than 200 characters is refused', () => {
  const result = parseCommitCommand({
    text: `30 ${'x'.repeat(201)}`,
    now: NOW,
  });
  assert.equal(result.ok, false);
  assert.match(result.reason, /200 characters/);
});

test('configured defaults are clamped into the allowed range', () => {
  const low = parseCommitCommand({
    text: '',
    now: NOW,
    defaults: { commitMinutes: 0 },
  });
  assert.equal(low.grant.expiresAt, NOW + MINUTE_MS);
  const high = parseCommitCommand({
    text: '',
    now: NOW,
    defaults: { commitMinutes: 999 },
  });
  assert.equal(high.grant.expiresAt, NOW + MAX_TTLS.commitMinutes * MINUTE_MS);
});
