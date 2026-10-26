---
name: meta-skill-creator
description: Design, review, or generate a skill definition, including trigger wording, structure, placement, and overlap checks against existing skills.
---

# Skill Creator

Load when creating, revising, or troubleshooting a skill definition, or when deciding whether a new skill is needed at all.

## Required actions

1. State the capability gap in one sentence: the single concrete task the skill will drive. If the request covers unrelated tasks, split it into single-responsibility skills instead of writing one large skill.
2. Check overlap before writing. Read the trigger field (`description`, `whenToUse`, etc.) of every existing skill in the configured skill directories. Extend an existing skill unless the new one has a distinct trigger and a distinct boundary.
3. Collect the four inputs when the user has not supplied them: purpose (the pain it removes), trigger (the phrasing that should load it), dependencies (scripts, references, and docs it must point at), and limits (format, length, and safety rules).
4. Write the trigger field as a routing rule, not a summary: action, object, and situation. Reject any description that names no observable trigger.
5. Generate the file from `references/skill-template.md`. Every skill must carry a load condition, ordered executable steps, a boundary, and pointers instead of copied rules.
6. Place it at the project skills directory or the global/user skills directory, following the target platform's convention. The skill ID comes from the path/filename convention of that platform; keep the identifier lowercase kebab-case and consistent with the directory or filename.
7. Self-test the routing: write three realistic user phrasings, name the skill each one should load, and explain why this skill wins over its neighbors. Revise the trigger field when any phrasing routes elsewhere.
8. Report the file path, skill ID, three trigger sentences, and anything deliberately left out.

## Quality gates

- One responsibility per skill. Two unrelated jobs in one file means two skills.
- No duplicate ID with an earlier source unless overriding that source is intended; later sources typically win.
- Every step names the file, tool, or command it uses. Unexecutable steps are rejected.
- Do not restate rules that a canonical document already states; point at the document instead.
- Supporting files are not loaded automatically. Name `references/...` and `scripts/...` explicitly in the body, with paths relative to the skill directory.
- A skill without a trigger field is never advertised to the model/agent. Use the platform's opt-out flag for skills that must stay load-only by explicit ID.
- Trigger/description length is platform-dependent; one to three sentences is the practical working range.

## Boundary

This skill designs and writes skill definition files. It does not implement the capability the new skill describes, does not edit or delete existing skills without approval, and does not write outside the target skills directory chosen in step 6.
