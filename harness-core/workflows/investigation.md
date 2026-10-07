---
description: Answer a question from runtime evidence before proposing any change
---

# Investigation

You own this task. Answer from evidence, stay in the lead.

An investigation is a read-only question: how does X work, why was Y built this way, are we sure about
Z. The deliverable is a cited answer, not a change. Do not build a sketch to answer a question you can
answer by reading.

> **Step 0 — Classify.** Run the [`task-classification`](../capabilities/orchestration/skills/task-classification/SKILL.md) skill
> and show the user its JSON before this workflow starts. `taskType` must be `investigation` — if
> something is broken, it is a `bug-fix` with this as its investigation, and the workflow changes. When
> the question is about what the screen actually does, `browser-verifier` is the cheapest way to observe
> the answer.

## Steps

1. **Name the question and the evidence standard.** What exactly is being asked, and what counts as an
   answer — a file, a call path, a documented decision, a commit, runtime behaviour? If the question is
   about behaviour, the standard includes running it.
2. **Read the real code, not the docs about the code.** Start from the implementation: the data shape,
   the call path, the boundary. Per
   [model-the-domain](../capabilities/orchestration/skills/principles/references/model-the-domain.md), understanding the domain
   structure first explains most "why" questions.
3. **Run what is runnable.** If the answer is observable — behaviour, timing, output, state — observe
   it. Reproduce before concluding, per
   [fix-root-causes](../capabilities/orchestration/skills/principles/references/fix-root-causes.md). When the observation is a UI,
   routing, or auth behaviour, dispatch `browser-verifier`: it is read-only toward source, and its
   findings are evidence rather than changes.
4. **Seed from history and docs.** Regression history and decision records explain why the code is the
   way it is. Use `docs/architecture/` and git history, and cite what you actually read.
   `docs/features/**` is a record of the last reconciliation, not a source of truth — where it disagrees
   with the code, the code is right.
5. **Fan out when wide.** A large surface goes to parallel units; converge on the synthesis yourself and
   keep summaries rather than raw dumps.
6. **Write the cited answer.** Each claim maps to an artifact you read or observed this session. If the
   evidence is incomplete, say exactly what is missing rather than guessing.
7. **Do not edit the docs.** This workflow is read-only, so a finding that a `docs/features/**` document
   is stale is a result to report, not an edit to make. Hand the caller the exact sections that are
   wrong and what the code says instead.

## Reply

The answer up front, then the evidence trail — files, runs, commits — supporting it, then what remains
uncertain. Name the principle that changed a decision.
