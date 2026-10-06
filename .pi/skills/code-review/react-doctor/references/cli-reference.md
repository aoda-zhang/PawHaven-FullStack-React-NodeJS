# react-doctor CLI reference

The invocation detail behind
[react-doctor](../SKILL.md). The rules in that file stay there because a doctor that does not run
the scan checks nothing; this file exists so the flag catalogue is not paid for on every load.

The version pin is `0.9.12` and it is the SAME version CI runs
(`.github/workflows/react-doctor.yml` sets `version: "0.9.12"` on `millionco/react-doctor@v2`).
Never `@latest`: it drifts ahead of the pin and the local scan stops agreeing with CI.

## Mandatory flags

| Flag                  | Why                                                                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-y`                  | Skips the interactive project prompt and scans **all** workspace projects. Without it the CLI prompts, and in an agent context it falls back to a subset — `apps/frontend/portal` and `apps/frontend/admin` get silently skipped. **This is the single most common cause of "doctor found nothing".** |
| `--verbose`           | Shows affected files and line numbers per rule.                                                                                                                                                                                                                                                       |
| `--scope changed`     | Only issues introduced vs the base branch — the same delta CI comments on.                                                                                                                                                                                                                            |
| `--include-untracked` | With `--scope changed`, also covers new/uncommitted files (the normal state mid-review).                                                                                                                                                                                                              |

## Scopes

```bash
# Regression check — the default for code review
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked

# Full codebase scan — only when explicitly asked for
npx react-doctor@0.9.12 -y --verbose

# Force coverage when the detected project list looks short
npx react-doctor@0.9.12 -y --verbose --scope changed --include-untracked --project apps/frontend/portal
```

`--project` accepts workspace names or directory paths, comma-separated, and overrides the `projects`
config field.

## /doctor — full local triage workflow

When the user types `/doctor`, says "run react doctor", or asks for a full triage:

```bash
curl --fail --silent --show-error \
  --header 'Cache-Control: no-cache' \
  https://www.react.doctor/prompts/react-doctor-agent.md
```

The playbook is the single source of truth — a scan → filter → triage → fix → validate loop that edits
the working tree directly, never commits, and never opens a PR. Follow every step in the fetched
playbook.

Pair it with per-rule prompts at `https://www.react.doctor/prompts/rules/<plugin>/<rule>.md`, fetched
on demand inside the playbook.

## Configuring or explaining rules

```bash
npx react-doctor@0.9.12 rules explain <rule>
npx react-doctor@0.9.12 rules disable|set|category|ignore-tag …
```

| Flag                  | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `-y`                  | Skip prompts, scan all workspace projects (required in agent context)   |
| `--verbose`           | Show affected files and line numbers per rule                           |
| `--scope changed`     | Only issues introduced vs base branch                                   |
| `--scope lines`       | Only issues whose source spans touch changed lines                      |
| `--include-untracked` | With files/changed/lines scope, also scan ordinary untracked files      |
| `--project <name>`    | Select workspace names or directory paths (comma-separated)             |
| `--base <ref>`        | Base git ref for files/changed/lines scope (auto-detected when omitted) |
| `--score`             | Output only the numeric score                                           |

Bumping the version requires explicit approval **AND** a matching bump in the workflow. Both sides move
together or neither does.
