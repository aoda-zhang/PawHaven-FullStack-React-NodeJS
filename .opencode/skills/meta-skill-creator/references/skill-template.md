# Skill definition template

Copy this structure into your platform's skill location. A skill is an index into the work, not the work itself: keep it short enough to read at load time.

## Frontmatter / Header

```markdown
---
name: <skill-id>
description: <action, object, and situation — written so the model/agent can decide when to load it>
# platform-specific flags, e.g. autoinvoke: false, disable: true, alwaysApply: false
---
```

| Field                       | Rule                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `name` / `id`               | Display label or identifier. The actual skill ID is usually derived from the file path or directory name.                               |
| `description` / `whenToUse` | Required for discovery. Only the ID, name, and this field are shown to the model/agent at selection time; the body is never advertised. |
| Platform flags              | Use the platform's opt-out flag to hide from auto-selection while keeping it loadable by explicit reference.                            |

## Body structure

```markdown
# <Skill Title>

<One line: Load when ...>

## <Steps / Workflow>

1. <executable step naming the file, tool, or command it uses>
2. ...

## <Navigation / Resources> <- only when the skill ships files or external docs

- `<references/...>`, `<scripts/...>`, canonical docs

## <Constraints / Limits> <- only when a limit is not already implied by a step

- format rule / length rule / safety rule

## <Examples> <- only when the expected output shape cannot be stated as a rule

<one input/output pair>

## Boundary

- what this skill must not do, and who owns the decision it stops short of
```

Omit empty sections. A section that says nothing is worse than no section.

Supporting files live beside the skill definition; paths written inside the skill resolve from that directory. Most platforms sample supporting file paths on load but do not load their contents until the skill explicitly references them.

## Review checklist

- [ ] Trigger field states action, object, and situation, and no neighboring skill claims the same trigger.
- [ ] The skill has one responsibility; anything unrelated is split out.
- [ ] Every step is executable and ordered; none is a restatement of a canonical doc.
- [ ] A `Boundary` states what the skill stops short of.
- [ ] Dependencies are named with relative paths so they can be found after load.
- [ ] The ID is lowercase kebab-case and matches the directory/filename convention.
- [ ] Three realistic user phrasings route to this skill and nowhere else.
