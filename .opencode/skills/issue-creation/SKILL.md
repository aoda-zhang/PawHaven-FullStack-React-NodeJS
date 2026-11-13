---
name: issue-creation
description: Create clear, consistently structured GitHub issues for PawHaven.
---

# Issue Creation

Use this skill whenever creating a GitHub issue for PawHaven.

## 1. Identify the issue type

Every issue must have exactly one type. Choose the best fit:

- `Bug`: Existing behavior is broken or incorrect.
- `Feature`: Introduces new functionality.
- `Enhancement`: Improves existing functionality or user experience.
- `Refactor`: Improves internal code structure without changing intended behavior.
- `Performance`: Addresses slow response, rendering, loading, or resource usage.
- `Security`: Addresses a security vulnerability or protection gap.
- `Documentation`: Adds or updates project documentation.
- `Chore`: Maintenance, tooling, dependencies, or repository configuration.

If the type is unclear, clarify before creating the issue. Do not use multiple types.

## 2. Format the title

Every title must follow this exact format:

`[Type] Short, specific description`

Use the type's capitalization shown above.

Examples:

- `[Bug] Animal image uploads fail frequently`
- `[Feature] Add moderation workflow for animal reports`
- `[Enhancement] Improve language switching on mobile`

The description must explain the main outcome or problem. Keep it concise and do not omit the type prefix.

## 3. Write a detailed issue description

Use this structure:

```markdown
## Context

Explain the relevant product or technical context and why this issue matters.

## Problem / Motivation

Describe the problem to solve or the need behind the request.

## Current behavior

Describe what happens today. For a new feature, explain the existing workflow or missing capability.

## Expected behavior

Describe the intended outcome clearly enough that implementation and review have a shared understanding.

## Requirements

- List the functional and technical requirements.
- Identify affected user roles, pages, services, or workflows when known.
- Include relevant validation, error handling, loading, empty, and responsive states.
- Record constraints, dependencies, and out-of-scope behavior when relevant.
- Include reproduction steps, environment details, and evidence for bugs when available.

## Acceptance criteria

- [ ] State a specific, observable condition that must be satisfied.
- [ ] Cover the important success and failure scenarios.
- [ ] Include relevant validation, accessibility, and responsive behavior.
- [ ] State the expected result in terms that can be verified.

## Additional notes

Add relevant screenshots, logs, API details, references, or implementation suggestions when available.
```

Adapt the sections to the issue. Keep all core sections, but write "N/A" only when a section genuinely does not apply. Do not invent technical details, root causes, reproduction steps, or implementation decisions. Mark unknown information as unresolved or ask the user for clarification.

## 4. Acceptance criteria quality

Acceptance criteria are mandatory for every issue.

- Write criteria as testable outcomes, not vague goals.
- Each checkbox must describe one verifiable result.
- Cover the primary user flow and meaningful edge cases.
- For bugs, describe the conditions under which the defect is fixed and confirm that expected existing behavior remains intact.
- For features and enhancements, cover the user-visible behavior and relevant failure or empty states.
- Include accessibility, responsive behavior, and performance criteria when relevant to the issue.
- Avoid prescribing implementation details unless they are necessary constraints.

Do not create an issue with empty, generic, or purely subjective acceptance criteria. Ask for missing product decisions when they prevent meaningful criteria from being written.

## 5. Before creating the issue

1. Inspect the repository's issue templates and existing labels.
2. Search open and recently closed issues for duplicates or closely related work.
3. If a matching issue already exists, report it instead of creating a duplicate.
4. Use an existing type label only when one is available and clearly matches. Do not create labels as part of issue creation unless the user explicitly asks.
5. Confirm the title and description meet this skill's requirements.
6. Create the issue in the PawHaven repository only after the requested scope is clear.

## 6. After creation

- Return the issue number, exact title, and GitHub URL.
- Briefly report any assumptions or unresolved details.
- Do not start implementation unless the user separately requests it.
