# .codebuddy Validator

> **Applies to**: CI / pre-commit / manual validation.
> **Purpose**: Define integrity checks that verify .codebuddy docs, rules, and workflows are internally consistent and up to date.

## Why This Exists

The .codebuddy is a living system. As agents edit docs, rename files, and update references, the following issues accumulate:

- Broken relative links (e.g., `../agents/pawhaven.md` that no longer exists)
- Stale references to renamed files (e.g., `AGENT.md` → `agents/pawhaven.md`)
- Missing directories referenced by docs (e.g., `ADR/`)
- Agent names in docs that don't match actual `*.md` files in `<AGENT_DIR>/agents/` (where `<AGENT_DIR>` defaults to `.codebuddy`)
- Workflow docs referencing steps that no longer exist

This rule defines the checks. Run them before every commit, and fix failures immediately.

## Validation Checklist

### 1. Link Integrity

```bash
# Check all relative .md links in <AGENT_DIR>/ for broken references (default: .codebuddy)
# Tools: markdown-link-check, lychee, or a simple grep + file-exists loop
```

- Every `[text](./path)` or `[text](../path)` in `<AGENT_DIR>/**/*.md` must resolve to an existing file (where `<AGENT_DIR>` defaults to `.codebuddy`).
- Every `see <file>.md` prose reference must resolve.
- External URLs are exempt but should be checked periodically.

### 2. Agent Name Consistency

```bash
# List all agent files
ls "$AGENT_DIR"/agents/*.md
# Extract agent names from filenames
# Verify every agent name referenced in docs matches a real file
```

- Agent names referenced in `pawhaven.md`, `dispatcher.md`, `workflows/*.md`, and `docs/README.md` must exist as `<AGENT_DIR>/agents/<name>.md` (default `<AGENT_DIR>` = `.codebuddy`).
- Example: if `pawhaven.md` references `frontend` agent, `<AGENT_DIR>/agents/frontend.md` must exist.

### 3. Workflow Step Consistency

- Every workflow in `<AGENT_DIR>/workflows/*.md` must have numbered steps that are internally consistent (default `<AGENT_DIR>` = `.codebuddy`).
- Workflows referenced in `pawhaven.md` §2.4 must exist as files.
- Workflow `description` frontmatter must match the actual workflow content.

### 4. Directory Existence

- `<AGENT_DIR>/docs/ADR/` must exist (create with template if missing).
- `<AGENT_DIR>/agents/` must contain at least: `frontend.md`, `backend.md`, `testing.md`, `code-review.md`, `architect.md`, `knowledge-update.md`.
- `<AGENT_DIR>/workflows/` must contain at least: `feature-development.md`, `bug-fix.md`, `handoff.md`.

### 5. Cross-Reference Consistency

- `docs/README.md` must reference all docs in `<AGENT_DIR>/docs/` (or explicitly exclude them with a reason).
- `agents/README.md` must reference all agents in `<AGENT_DIR>/agents/`.
- `workflows/README.md` must reference all workflows in `<AGENT_DIR>/workflows/`.
- `rules/README.md` must reference all rules in `<AGENT_DIR>/rules/`.

### 6. Frontmatter Validity

Every `.md` file in `<AGENT_DIR>/` should have valid YAML frontmatter (default `<AGENT_DIR>` = `.codebuddy`):

```yaml
---
description: >
  [Single-line or multi-line description]
---
```

- `description` is required for all agent and workflow files.
- No unknown keys (fail on typos like `discription`).

## Running the Checks

### Manual

```bash
# From repo root
./scripts/harness-check.sh
```

### CI (GitHub Actions / GitLab CI)

Add a step to your CI pipeline:

```yaml
- name: .codebuddy Integrity Check
  run: |
    ./scripts/harness-check.sh
    if [ $? -ne 0 ]; then
      echo ".codebuddy integrity check failed. Run ./scripts/harness-check.sh locally to fix."
      exit 1
    fi
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml (if using pre-commit framework)
repos:
  - repo: local
    hooks:
      - id: harness-check
        name: .codebuddy Integrity Check
        entry: ./scripts/harness-check.sh
        language: system
        pass_filenames: false
        always_run: true
```

## Failure Response

When a check fails:

1. **Do not ignore**. A broken link or stale reference means an agent may read wrong instructions.
2. **Fix immediately** — either update the reference or restore the missing target.
3. **If the target was intentionally removed**, update all references to point to the replacement or mark as deprecated.
4. **Re-run the check** until it passes.

## Check Script Reference Implementation

> The directory name is parameterized via `AGENT_DIR` (defaults to `.codebuddy`). If you rename the agent-control directory, set `AGENT_DIR=your-name` before running the script — no other edits needed.

```bash
#!/bin/bash
# scripts/harness-check.sh — Reference implementation
# Run from repo root
#
# AGENT_DIR points at the agent-control directory. Change this single
# variable if the directory is renamed (e.g. to .cursorrules, .claude, etc.).

set -e

AGENT_DIR="${AGENT_DIR:-.codebuddy}"

ERRORS=0

echo "=== ${AGENT_DIR} Integrity Check ==="

# 1. Check for stale main-agent.md references
echo "[1/6] Checking for stale main-agent.md references..."
if grep -r "main-agent\.md" "$AGENT_DIR/" --include="*.md" > /dev/null 2>&1; then
  echo "  FAIL: Found stale main-agent.md references:"
  grep -rn "main-agent\.md" "$AGENT_DIR/" --include="*.md" || true
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS"
fi

# 2. Check pawhaven.md exists
echo "[2/6] Checking pawhaven.md exists..."
if [ ! -f "$AGENT_DIR/agents/pawhaven.md" ]; then
  echo "  FAIL: $AGENT_DIR/agents/pawhaven.md does not exist"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS"
fi

# 3. Check required directories exist
echo "[3/6] Checking required directories..."
for dir in "$AGENT_DIR/docs/ADR" "$AGENT_DIR/agents" "$AGENT_DIR/workflows" "$AGENT_DIR/rules"; do
  if [ ! -d "$dir" ]; then
    echo "  FAIL: $dir does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "  PASS"

# 4. Check required agent files exist
echo "[4/6] Checking required agent files..."
for agent in frontend backend testing code-review architect knowledge-update; do
  if [ ! -f "$AGENT_DIR/agents/${agent}.md" ]; then
    echo "  FAIL: $AGENT_DIR/agents/${agent}.md does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "  PASS"

# 5. Check required workflow files exist
echo "[5/6] Checking required workflow files..."
for workflow in feature-development bug-fix handoff; do
  if [ ! -f "$AGENT_DIR/workflows/${workflow}.md" ]; then
    echo "  FAIL: $AGENT_DIR/workflows/${workflow}.md does not exist"
    ERRORS=$((ERRORS + 1))
  fi
done
echo "  PASS"

# 6. Check for broken relative .md links (basic)
echo "[6/6] Checking for broken relative links..."
# This is a simplified check — a full implementation would parse markdown links
# and verify each target exists relative to the source file.
echo "  SKIPPED (requires markdown parser — add to CI with markdown-link-check)"

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "=== All checks passed ==="
  exit 0
else
  echo "=== $ERRORS check(s) failed ==="
  exit 1
fi
```

> **Note**: This is a reference implementation. The actual CI check should use a proper markdown link checker (e.g., `markdown-link-check`, `lychee`) for comprehensive link validation.
