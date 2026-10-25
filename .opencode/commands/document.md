---
description: Create or update documentation through the approval-first workflow
agent: orchestrator
---

# Document

Create or update documentation for $ARGUMENTS.

1. Inspect the existing document, implementation/config/scripts it describes, and relevant documentation conventions.
2. Present a plan with audience, purpose, exact files/scope, factual sources, risks, acceptance criteria, and checks (including links/examples when relevant).
3. Wait for explicit user approval before editing.
4. After approval, use the `documentation` Skill. Verify architectural and implementation claims against source; do not invent facts or replace accurate content without cause.
5. Run relevant existing documentation checks. Do not run unrelated application suites for documentation-only changes.
6. Stop at handoff. Do not commit, push, or create a PR unless explicitly requested.
