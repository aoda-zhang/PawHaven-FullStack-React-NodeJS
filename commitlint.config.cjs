// Commit format: [PW-<issue>] type(scope?): subject
// The issue prefix is required and must match the checked-out work branch.

const { execFileSync } = require('node:child_process');

module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^\[(PW-\d+)\] (feat|fix|docs|style|refactor|perf|test|chore)(?:\(([^)]+)\))?: (.+)$/,
      headerCorrespondence: ['ticket', 'type', 'scope', 'subject'],
    },
  },
  plugins: [
    {
      rules: {
        'branch-ticket-match': (parsed) => {
          let branchName = '';

          try {
            branchName = execFileSync('git', ['branch', '--show-current'], {
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'ignore'],
            }).trim();
          } catch {
            return [
              false,
              'Unable to determine the current Git branch; commit validation requires a PW-<issue> branch.',
            ];
          }

          const headerMatch = parsed.header?.match(/^\[(PW-\d+)\] /);
          const validBranch = /^PW-\d+$/.test(branchName);
          const matchesBranch = validBranch && headerMatch?.[1] === branchName;

          return [
            Boolean(matchesBranch),
            `Commit message ticket prefix must match the current work branch (branch: "${branchName}"). Expected "[${branchName}] ...".`,
          ];
        },
      },
    },
  ],
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'],
    ],
    'scope-case': [0],
    'subject-case': [0],
    'subject-min-length': [2, 'always', 5],
    'header-max-length': [2, 'always', 100],
    'branch-ticket-match': [2, 'always'],
  },
};
