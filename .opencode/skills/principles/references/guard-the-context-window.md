# Guard the Context Window

Route bulk to subagents; keep summaries in the main thread.

## When it applies

Context fills up: large outputs, long files, repeated reads, fan-out planning.

## The rule

Bulk work (reading many files, running broad searches, mechanical edits across call sites) belongs in subagents. The main thread keeps the summaries, the decisions, and the diffs it owns. Before re-reading a long file, ask whether you actually need the bytes or just the shape.

## PawHaven notes

- Exploring across the monorepo (`apps/`, `packages/`, `libs/`): delegate the survey to a subagent, keep the synthesis.
- Long generated or vendor files are never worth inlining; read the relevant slice.
- When a subagent reports, own the result: review its diff, summarize in your own words, don't paste its whole transcript back.

## Anti-pattern

Reading a 3,000-line file three times in one session when a symbol outline or a subagent summary would do.
