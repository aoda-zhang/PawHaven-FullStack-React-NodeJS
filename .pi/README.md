<!-- GENERATED FILE. Do not edit. Source: harness-core/. Regenerate with `pnpm harness:generate`. -->

# `.pi/` — generated Pi runtime output

**Everything in this directory is generated.** It is not the source of anything, and it is not edited
by hand. The canonical harness is [`harness-core/`](../harness-core/README.md); this directory is
what the Pi runtime loads.

```bash
pnpm harness:generate   # rebuild this directory from the canonical source
pnpm pi:check           # prove the Pi loader accepts what is here
```

Delete this directory and run `pnpm harness:generate` and it comes back identically. If it does not,
the source changed and nothing regenerated it — which is what
[`harness:check:generated`](../harness-core/validation/README.md) exists to catch.

| What Pi loads                                       | Generated from                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `.pi/agents/<plugin>__<agent>.md`                  | `harness-core/plugins/<plugin>/agents/<agent>.md`                              |
| `.pi/skills/<plugin>/<skill>/**`                   | `harness-core/plugins/<plugin>/skills/<skill>/**`                              |
| `.pi/prompts/<workflow>.md`, `.pi/prompts/patterns/*.md` | `harness-core/workflows/**`                                                |
| `.pi/prompts/rules/*.md`                           | `harness-core/rules/*.md`                                                     |
| `.pi/settings.json`                               | `harness-core/config/model-policy.yaml` + the adapter's translation tables     |

The generated tree is NOT a mirror of the canonical tree. The adapter translates canonical semantics —
plugin/agent/skill/workflow/rule — into Pi's native layout: a flat agent namespace, a Pi skill tree,
and workflow prompts. That is the whole point of an adapter: canonical stays runtime-neutral, and the
Pi specifics live only here.

## How to use it

1. `/trust` once — project configuration only loads after trust.
2. `/reload` after any `pnpm harness:generate`.
3. The slash commands in the `/` menu are the workflows (prompts). Subagents are dispatched by name.
4. Before committing anything under `.pi/`: `pnpm harness:generate`, then `pnpm pi:check`, then
   `pnpm check:links`.

## What is Pi-specific, and why it is here rather than in the source

The adapter, not the canonical source, holds Pi's frontmatter field names, Pi's tool identifiers, the
permission syntax, the dispatch configuration, the package list, and the translation from an abstract
model tier to a runtime thinking level. Those are facts about Pi, and the canonical source is written
so that a second runtime does not mean rewriting nine agents.

See [`adapters/pi/README.md`](../harness-core/adapters/pi/README.md) for the full table and the
reason behind each decision.
