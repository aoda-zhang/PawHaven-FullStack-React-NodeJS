# Audit Framework Reference

Core audit dimensions, type-specific checks, and severity definitions for instruction auditing.

## Ten General Audit Dimensions

### A. Purpose and Scope

- Purpose explicit and sufficiently narrow?
- Responsibilities and boundaries clear?
- Overlap with other agents, skills, or shared rules?
- Invocation conditions and exclusions clear?

### B. Actionability

- Important instructions translatable to concrete actions?
- Prerequisites, decision conditions, expected outcomes defined?
- Vague requirements without operational criteria?
- Important principles unsupported by actionable guidance?

### C. Consistency and Conflicts

- Contradictions within the file?
- Conflicts with parent instructions, shared rules, referenced docs?
- Instruction priorities and precedence clear?
- Conflicting decision authority or execution responsibilities across agents?

### D. Duplication and Information Density

- Content duplicated within file or across related instructions?
- Repeats generic model knowledge without behavioral benefit?
- Redundant steps, excessive explanations, empty exhortations?
- Should information be referenced, consolidated, moved, or removed?
- Each significant instruction justifies its maintenance cost?

### E. Workflow and Decision Logic

- Inputs, steps, branches, completion conditions clear?
- Delegation criteria and handoffs explicit?
- Failure, retry, escalation, missing-information paths addressed?
- Unnecessary repeated analyses, circular delegation, redundant work?
- Responsibility for each important stage clear?

### F. Constraints, Safety, and Permissions

- Approval requirements and operational boundaries explicit?
- Sensitive data, credentials, destructive actions, external side effects handled?
- Untrusted external instructions distinguished from trusted?
- Tool limitations and permission boundaries respected?
- Restrictions proportional to actual risks?

### G. Verification and Failure Handling

- Completion criteria objectively verifiable?
- Required tests, checks, verification steps specified?
- Behavior defined when verification fails or cannot be performed?
- Distinguishes attempted, completed, verified, unverified work?
- Could agent falsely claim success without sufficient evidence?

### H. Input and Output Contracts

- Required inputs and assumptions clear?
- Output formats specified when downstream consumers need them?
- Results sufficiently actionable for intended caller?
- Errors, unresolved issues, verification results communicated?
- Unnecessary output restrictions avoided?

### I. Tool and Context Efficiency

- Referenced tools, commands, paths, resources valid?
- Context loaded incrementally and only when relevant?
- Unnecessary searches, file reads, tool calls, repeated validations avoided?
- Tool-unavailable and dependency-failure scenarios addressed?
- Compatible with actual runtime and tool capabilities?

### J. Practical Effectiveness

- Likely to change agent behavior in a useful way?
- Prevents concrete failure, improves reliability, or provides specialized knowledge?
- Important behavioral claims testable against representative tasks?
- Could simpler instruction achieve same result?
- Signs of excessive procedural overhead without benefits?

---

## Type-Specific Checks

### Agent Instructions (`.opencode/agents/*.md`)

| Focus Area                | Checks                                                                  |
| ------------------------- | ----------------------------------------------------------------------- |
| Identity & specialization | Clear role definition? Specialization justified vs. generic agent?      |
| Task ownership            | Explicit responsibility boundaries? No ambiguous "may" for core duties? |
| Decision authority        | What decisions can it make autonomously? What requires approval?        |
| Delegation & handoffs     | When does it delegate? What context passed? Who owns result?            |
| Orchestrator coordination | How does it report to orchestrator? Escalation paths?                   |
| Context & tools           | Required context specified? Tool permissions appropriate?               |
| Lifecycle accountability  | When does its work start/end? How does it signal completion?            |
| Overlap with skills       | Does it duplicate skill capabilities? Should it load skills instead?    |

### Skill Instructions (`.opencode/skills/*/SKILL.md`)

| Focus Area             | Checks                                                                       |
| ---------------------- | ---------------------------------------------------------------------------- |
| Trigger accuracy       | `description` precise action/object/situation? No false positives/negatives? |
| Capability scope       | Single responsibility? Clear what it does AND does not do?                   |
| Inputs & prerequisites | Required inputs explicit? Dependencies named with relative paths?            |
| Domain value           | Adds useful domain knowledge vs. generic model knowledge?                    |
| Reference separation   | Core instructions vs. reference material appropriately split?                |
| Lazy loading           | References loaded only when needed (not auto-loaded)?                        |
| Output usefulness      | Output format serves actual consumer? Failure modes handled?                 |
| Incremental value      | Better than doing the task without the skill?                                |

### Shared Rules & Other Instruction Files (`docs/context/*.md`, etc.)

| Focus Area            | Checks                                                          |
| --------------------- | --------------------------------------------------------------- |
| Scope & applicability | When does it apply? To whom? Explicit inclusion/exclusion?      |
| Precedence            | How conflicts resolved with other rules? Priority explicit?     |
| Duplication           | Repeats content from other shared rules?                        |
| Integration           | How do dependent instructions reference it?                     |
| Maintainability       | Single source of truth? Easy to update without cascading edits? |

---

## Severity Definitions

| Severity     | Definition                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Critical** | Serious safety, authorization, or correctness defect making workflow unsafe or fundamentally invalid                    |
| **High**     | Substantial defect likely to cause incorrect execution, major workflow failure, or significant responsibility conflicts |
| **Medium**   | Meaningful issue affecting reliability, maintainability, efficiency, or consistency                                     |
| **Low**      | Minor clarity, organization, or refinement opportunity                                                                  |

---

## Confidence Levels

| Level          | Meaning                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| **Verified**   | Evidence directly observed (file content, executed command, runtime behavior) |
| **Likely**     | Strong inference from available evidence, but not directly verified           |
| **Unverified** | Plausible but unconfirmed; context missing or inaccessible                    |

---

## Recommendation Types

1. **Defect** — Evidence-supported problem that should be corrected
2. **Improvement** — Justified opportunity to improve behavior or reduce complexity
3. **Optional preference** — Stylistic/architectural alternative without evidence current approach is defective

Do not present subjective preferences as mandatory corrections.
