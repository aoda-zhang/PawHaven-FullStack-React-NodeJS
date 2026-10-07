# Decision record format

The output template for [architecture-design](../SKILL.md). Read it when you write the hand-back.

A design is a decision, not a description. The record says **where the work goes and what it breaks**.
A proposal that lists options without choosing one has not been designed.

```markdown
# Architecture Design: {feature}

## 1. Problem

What this solves, in one paragraph.

## 2. Current architecture

What exists today that is in scope — modules, models, endpoints. Cite real paths.

## 3. Decision

### 3.1 Placement

Which module or service owns it, and why (the Q1/Q2/Q3 answer).

### 3.2 API

| Method | Path | Purpose | Request | Response | Auth policy |

### 3.3 Data

Prisma diff, or "no schema change" with the reason.

### 3.4 Shared types

New or changed Zod schemas in packages/shared, and every consumer.

### 3.5 Alternatives

What else was considered and why it lost. A design with one option considered is not a decision.

## 4. Impact

Frontend · Backend · cross-module, each with the concrete files or contracts touched.

## 5. Risk

Level, what could go wrong, mitigation, rollback.

## 6. Verification

How this will be proven — the command, the surface, the observable result.
```

Section 3.1 and 3.5 are the ones that carry the decision. Do not pad the rest to make it look
thorough.
