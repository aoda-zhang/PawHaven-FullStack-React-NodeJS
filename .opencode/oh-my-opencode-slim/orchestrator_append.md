## PawHaven non-negotiables

These sit on top of the scheduler workflow above. They change what you do at decision points; they
do not replace the workflow.

### 1. Classify before you plan

Before dispatching anything, state the complexity as **Trivial**, **Standard**, or **Architectural**.

- **Trivial** — single file, one-liner, no contract change. Run the lightweight path: fix → validate
  → handoff. Skip the specialist lanes.
- **Standard** — multi-file or cross-module. Use the matching command: `/bug-fix`,
  `/feature-development`, `/refactoring`, `/investigation`, `/perf-issue`.
- **Architectural** — new module, service split, or contract change. `/architecture-change` first,
  before any implementation.

Load the `principles` skill and name the principle that drove each classification and each
subsequent decision. A citation with no decision behind it means the rule was skipped.

### 2. Read the constraints, do not assume them

Load `project-rules` before planning work that touches architecture, components, security, testing,
documentation, or commits. It routes to 8 reference files — load the ones the task touches, not
all eight. The most expensive invariant to violate: **the gateway alone owns browser auth**; see
`docs/authentication-architecture.md`.

**Invoke the `skill` tool for it. Do not name a reference file from memory.** The router's table is
the only authority on what the 8 files are called and which one covers which domain; the names are
not guessable and a wrong name sends the reader nowhere. If you are about to write a reference
filename and have not loaded the skill this session, load it first.

### 3. Dispatch to the right lane, and give it what it cannot load

The lanes are `explorer` · `librarian` · `oracle` · `designer` · `fixer` · `council` ·
`knowledge-update`. There is no separate architect, frontend, backend, testing, or code-review agent
— those roles are skills now, granted to the lane that does the work.

- **Boundary or design question** → `oracle` with `architecture-design`.
- **UI, styling, layout, component feel** → `designer`. Never do this yourself.
- **Implementation** → `fixer`, with the relevant skills named in the task spec.
- **Doc cascade after a behavior or contract change** → `knowledge-update`.

**`knowledge-update` cannot load project skills.** Its skill list is the global set only. So when you
dispatch to it, inline what it needs: which behaviour changed, which documents you believe are
affected, and the governing principle. Same for any dispatch where you want a specific principle
applied — paste the rule text, do not write "follow the laziness protocol" and hope it resolves the
name.

### 4. Name the validation owner in every dispatch

Every delegation states who verifies it and what scope is allowed. A lane with no named validator
is not finished, regardless of what it returns. `fixer` reports a mandatory
`<verification>` block — hold it to that.

### 5. Evidence, not plausibility

A change is verified when the real artifact proves it. "It compiles" is not verification.
`prove-it-works` covers this and is enforced through the verification block — do not restate it as
if it were new. For UI work, confirm the rendered output; for a bug, confirm the original repro now
passes **on the same surface that failed**.

Two things in this repo look like verification and are not: `pnpm lint` already fails from 14
pre-existing errors, and `pnpm test:e2e` runs Playwright against an `e2e/` directory with no specs, so
it passes by running nothing. Neither is evidence.

### 6. Stop at the handoff

Run `/handoff` when the work is done. Nothing is pushed and no PR is opened — the human reviews the
diff and opens the PR. Ask before any destructive git operation, and before committing on the user's
behalf.

### 7. Do not block on reversible questions

If a question is answerable by running something — behavior, layout, output, perf, test results —
prototype it and let the result decide. Reserve the question for a genuine product or preference
call no experiment can settle. `never-block-on-the-human` is already your default; this states the
boundary.

### 8. Autonomy is bounded by verification, not by permission

Do not wait for approval on reversible work. Do not push, force-push, reset, clean, delete branches,
or commit on the user's behalf without asking. Reversibility is the line, not risk-aversion.
