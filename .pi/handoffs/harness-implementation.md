# Handoff — PawHaven AI Development Harness Implementation

## Task

Implement the harness defined by `PawHaven_AI_Development_Harness_Master_Prompt.md` (repo root,
untracked) inside the existing `.pi/` infrastructure. Branch: `pawhaven-harness`. Owner approved
the plan with two amendments (see Decisions).

**Runtime note**: start this session's parent pi with `pi --exclude-tools subagents_enable` so
the `subagent` tool is present in the tool list from the first request. Without it, dynamic
registration via `subagents_enable` does not take effect on this provider and dispatch is
impossible.

## Current state

Inspection complete, plan approved, **no implementation dispatches have run yet**. Working tree:
only `.vscode/settings.json` (pre-existing modification — do not touch) and the master prompt
file (leave untracked).

## Completed work

Full inspection of `.pi/` (agents, skills, prompts, settings.json, scripts/check-pi-harness.mjs),
git state, and cross-referencing against all 35 sections of the master prompt.

Classification (master prompt §6 contract):

```json
{
  "taskType": "architecture-change",
  "secondaryTasks": ["refactor", "documentation"],
  "scope": ["infrastructure", "documentation", "testing"],
  "complexity": "high",
  "risk": "medium",
  "confidence": 0.9,
  "workflow": "architecture-change",
  "requiresClarification": false
}
```

Already compliant, **do not rework**: 9 agents matching §4; 6 canonical workflow prompts (§11);
thinking levels in settings.json (§28); progressive-disclosure skills (§15); knowledge/skill
separation (§16); frontend dev/review split with react-doctor on the review side (§4, §13);
`pnpm pi-check` validator exists; `.opencode/` already deleted from disk.

## Identified gaps (verified with grep/find, not assumed)

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Ref     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | `new-feature.md` and `feature-development.md` are two independent feature-workflow implementations                                                                                                                                                                                                                                                                                                                                                                                                            | §20     |
| 2   | No `browser-verifier` agent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §14/§34 |
| 3   | Dangling `knowledge-update` agent references: `.pi/prompts/handoff.md:30`, `.pi/skills/project-rules/references/orchestrator.md:52`, `.pi/skills/project-rules/references/documentation.md:5,55,71`                                                                                                                                                                                                                                                                                                           | §31.2   |
| 4   | Stale `.opencode/` authority pointers in: `.pi/prompts/handoff.md:10`, `.pi/skills/project-rules/references/git.md:10,38,50`, `.pi/skills/project-rules/references/orchestrator.md:54`, `.pi/skills/project-rules/SKILL.md:46-47`, `.pi/skills/project-rules/references/harness-validator.md`, `.pi/skills/project-rules/references/documentation.md`, `.pi/README.md`, `.pi/agents/frontend/review/skills/i18n-doctor/SKILL.md`, `.pi/agents/frontend/dev/skills/i18n/references/adding-module-or-locale.md` | P1      |
| 5   | No §5 `<result>` standard output contract in any agent definition (grep `<result>` in `.pi/agents`: zero matches)                                                                                                                                                                                                                                                                                                                                                                                             | §5      |
| 6   | No unified task-classification artifact; per-prompt complexity notes only                                                                                                                                                                                                                                                                                                                                                                                                                                     | §6/P2   |
| 7   | No `.pi/handoffs/` structured artifact dir (this file is its first member)                                                                                                                                                                                                                                                                                                                                                                                                                                    | §18/P5  |
| 8   | No `.pi/evals/` corpus                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | §26/P6  |
| 9   | `oracle` missing from settings.json `agentOverrides`                                                                                                                                                                                                                                                                                                                                                                                                                                                          | §28     |
| 10  | `scripts/check-pi-harness.mjs` hardcodes EXPECTED_SKILLS=12, EXPECTED_PROMPTS=10, EXPECTED_AGENTS=9 names — must be synced at the end                                                                                                                                                                                                                                                                                                                                                                         | P1      |

## Important decisions (user-approved)

1. **Delete `new-feature.md` entirely** — keep only `feature-development` as canonical (§20).
   Owner explicitly rejected the thin-alias option.
2. **knowledge-update: option (a)** — do NOT create the agent (§31.2: no agent without clear
   responsibility). Rewrite the three dangling references so doc updates route through the
   main session's `/handoff` flow, consistent with AGENTS.md's "update the matching doc in the
   same change" rule.
3. **Phase 7 optimization is out of scope** — §27 forbids optimizing before eval evidence
   exists.
4. **Task classification lands as a project skill** (`.pi/skills/task-classification/`), used by
   the main session at routing time — not a new agent.
5. **browser-verifier uses the repo's existing Playwright** (`pnpm test:e2e` stack, dev server
   :3001 / gateway :8080) driven via bash; read-only toward source; no heavy new dependencies.
6. **No commits** without explicit owner request; all work stays in the working tree.
7. **Dispatch discipline**: every change goes through subagent lanes (writer = builtin `worker`
   for harness files; none of the 9 project agents owns `.pi/`). Main session reviews diffs and
   runs the combined verification.

## Verification performed

- `git branch -a`, `git status --short` — branch state as described above
- `find .pi -type f` — full inventory (9 agents, 10 prompts, 12 project skills + 5 code-review
  doctors counted within, 14 agent-private skills, settings.json, README.md)
- `grep -rn knowledge-update .pi` — 3 files, all references, agent absent from `.pi/agents/`
- `grep -rn .opencode .pi --include=*.md` — 9 files listed in gap #4
- `grep <result> .pi/agents` — zero matches
- Read `scripts/check-pi-harness.mjs` expectation constants
- Read `.pi/settings.json`, agent frontmatter (all 9), prompt tables in `.pi/README.md`,
  `feature-development.md`, `new-feature.md`, `bug-fix.md`, `refactoring.md`, `handoff.md`

## Remaining work — four lanes, three waves

**Wave 1 (parallel, disjoint file sets):**

- **Lane A — Normalize (P1: gaps 1/3/4/5/9).** Delete `new-feature.md`; rewrite the three
  `knowledge-update` references per decision 2; repoint `.opencode/` authority pointers to `.pi/`
  (historical narrative may stay, e.g. README's "legacy and can be deleted" sentence — reword to
  past tense); add §5 output contract block to all 9 agent definitions; add
  `oracle: { "thinking": "high" }` to settings.json. Does NOT touch: README.md (Lane D owns it),
  check-pi-harness.mjs, AGENTS.md, the 6 workflow prompts' classification wiring (Lane B).
- **Lane C — Handoffs (gap 7).** Create `.pi/handoffs/README.md` defining the
  §18 8-field artifact (Task / Current state / Completed work / Important decisions /
  Verification performed / Known issues / Remaining work / Next action) + template. The evals
  half of this lane (gap 8) was deliberately dropped and is not to be recreated; the written
  handoff is what replaced it.

**Wave 2 (after A — overlaps settings.json and prompts):**

- **Lane B — Classification + browser verifier (P2/P4: gaps 6/2).** New project skill
  `.pi/skills/task-classification/` implementing the §6 JSON contract, §8 scope categories, §9
  complexity, §10 risk rules, routed to the 6 canonical prompts. New agent
  `.pi/agents/browser-verifier.md` per decision 5, with settings.json override (`thinking:
"low"` for deterministic checks per §28). Wire classification + browser-verification gate
  mentions into the 6 workflow prompts.

**Wave 3 (after B and C — depends on final counts):**

- **Lane D — Validator + docs sync (gap 10).** Update check-pi-harness.mjs:
  EXPECTED_SKILLS 12→13, EXPECTED_PROMPTS 10→9, EXPECTED_AGENTS +`browser-verifier` (9→10).
  Sync `.pi/README.md` fully (new prompt table, agent count, handoffs/evals dirs, oracle
  override) and the AGENTS.md harness section. Run `pnpm pi-check` → must be zero diagnostics.

**Final gate (main session):** run `pnpm pi-check` on the combined tree; dispatch `reviewer`
(fresh context) over the full diff against §5/§12 review philosophy; fix findings via a fix
worker; report per master prompt §33 (files changed, decisions, workflows, agents, skills,
classification behavior, verification results, risks, recommended next evals).

## Known issues / risks

- Lane A's README historical wording vs Lane D's full sync — sequence D last to avoid rework.
- pi-subagents builtin `worker` existence should be confirmed via `subagent({action:"list",
capabilities:true})` before first dispatch; if `worker` is unavailable, fall back to
  `delegate`.
- Deleting `new-feature.md` changes the prompt count mid-flight; `pnpm pi-check` is expected to
  FAIL between waves and only turn green at Lane D. Do not treat intermediate red as regression.
- `.vscode/settings.json` is dirty from before this task — leave it, do not stage or revert.

## Next action

Dispatch Lane A + Lane C in parallel with the builtin `worker` agent (async), carrying this
file's lane specs verbatim as the bounded handoff.
