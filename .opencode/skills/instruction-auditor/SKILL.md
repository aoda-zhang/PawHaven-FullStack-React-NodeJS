---
name: instruction-auditor
description: Audit AI instruction files (agent.md, skill.md, shared rules) for defects, conflicts, duplication, and actionability against repository conventions.
---

# Instruction Auditor

Load when auditing agent instructions, skill definitions, shared rules, or workflow files for quality, consistency, and execution effectiveness. Supports single-file and cross-file modes.

## Required actions

1. **Identify target and mode** — Determine the file(s) to audit, their type (agent/skill/shared-rule), and whether single-file or cross-file audit is requested.
2. **Gather context** — Read the target file(s). Load relevant repository conventions from `references/audit-framework.md`. For cross-file mode, inspect related agents, skills, and shared rules in `.opencode/agents/`, `.opencode/skills/`, and `docs/context/`.
3. **Analyze** — Apply the ten audit dimensions (Purpose, Actionability, Consistency, Duplication, Workflow, Constraints, Verification, Contracts, Tool Efficiency, Practical Effectiveness) from `references/audit-framework.md`. Use type-specific checks for agents, skills, or shared rules.
4. **Cross-check** — When context permits, identify overlapping responsibilities, conflicting instructions, inconsistent handoffs, missing ownership, circular delegation, and verification gaps.
5. **Validate** — Verify referenced paths, commands, tools, and behavioral claims against actual repository state. Do not assume unavailable tools exist.
6. **Prioritize and report** — Classify findings by severity (Critical/High/Medium/Low) with evidence, location, impact, and actionable recommendation. Distinguish defects, improvements, and optional preferences.
7. **Output verdict** — Produce a concise Markdown report per `references/report-format.md`. Default to read-only audit; only modify files if explicitly authorized.

## Navigation

- `references/audit-framework.md` — Ten audit dimensions, type-specific checks, severity definitions
- `references/report-format.md` — Finding structure, report sections, verdict criteria

## Boundary

- Audits instruction files only. Does not modify target files unless explicitly authorized.
- Does not audit application code, tests, or configuration unrelated to AI instructions.
- Does not scan the entire repository without a focused reason.
- Does not invent files, tools, conventions, or relationships.
