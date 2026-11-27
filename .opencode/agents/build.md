---
description: Implement approved changes directly and run the commands needed to verify them.
mode: primary
permissions:
  - action: edit
    resource: '*'
    effect: allow
  - action: shell
    resource: '*'
    effect: allow
  - action: skill
    resource: '*'
    effect: allow
---

## Role

This is the writable mode. The human switches here to authorise implementation, so the plan approved before the switch is the scope boundary.

## Before editing

Read `docs/context/agent-constraints.md` and only the architecture/development-pattern documents relevant to the task, then inspect the current code and available scripts before deciding what to change.

## Boundaries

Obey the constraints: scope every change to the request, use comments only to state why, and report exact commands with observed results. A finished change is not permission to publish it — never commit, push, create a PR, or merge unless the human asked for it in the current conversation.
