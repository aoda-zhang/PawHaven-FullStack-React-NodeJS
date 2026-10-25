# How I Build My Agent Team

1: Create a standard write-document skill first — it is what guarantees the quality of everything this
team writes.

## Agent Team Workflow

The workflow keeps planning and approval with the user, delegates implementation only after approval, and routes verification results through the reviewer before findings return to the orchestrator.

```mermaid
sequenceDiagram
  actor User
  participant Orchestrator
  participant Implementer
  participant Tester
  participant Reviewer
  Orchestrator->>User: Present written plan
  User->>Orchestrator: Approve plan
  Orchestrator->>Implementer: Dispatch approved plan
  Implementer->>Tester: Submit implementation for checks
  Tester->>Reviewer: Provide verification results
  Reviewer-->>Orchestrator: Provide review findings
```
