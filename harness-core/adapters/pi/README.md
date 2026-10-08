# Pi adapter

The Pi runtime adapter. It translates `harness-core/` into the Pi-native layout under `.pi/`.

This is the **only** place Pi-specific facts live. Everything here — frontmatter field names, tool
identifiers, the permission syntax, dispatch configuration, the package list, and the abstract-tier →
runtime-thinking mapping — would be wrong in canonical source, because canonical source is runtime-neutral
and a second runtime must not require rewriting nine agents.

## What it generates

| Pi path                             | From canonical                                                        |
| ----------------------------------- | --------------------------------------------------------------------- |
| `.pi/agents/<plugin>__<agent>.md`   | `plugins/<plugin>/agents/<agent>.md` (flattened, namespaced)          |
| `.pi/skills/<plugin>/<skill>/**`    | `plugins/<plugin>/skills/<skill>/**` (copied)                         |
| `.pi/prompts/<workflow>.md`         | `workflows/<workflow>.md`                                             |
| `.pi/prompts/patterns/<pattern>.md` | `workflows/patterns/<pattern>.md`                                     |
| `.pi/prompts/rules/<rule>.md`       | `rules/<rule>.md` (translated into runtime context)                   |
| `.pi/settings.json`                 | `config/model-policy.yaml` + the translation tables in `generate.mjs` |
| `.pi/README.md`                     | generated header                                                      |

The canonical tree is **not** a mirror of `.pi/`. A canonical agent sits in a plugin's `agents/` directory;
Pi wants a flat `agents/` with a plugin-prefixed name. A canonical workflow is a `workflows/` file; Pi
wants a `prompts/` entry. The mapping is the adapter's job.

## Translation decisions

`generate.mjs` holds every Pi-specific decision as a table, each with a reason:

- **`TOOL_MAP`** — canonical tool → Pi tool identifier (`read` → `read`, `dispatch` → `subagent`, …).
- **`PI_AGENT_SETTINGS`** — per-agent Pi frontmatter that has no canonical counterpart (`systemPromptMode`,
  `inheritProjectContext`, `defaultContext`, `runtimeTools`). Every agent needs an entry; an agent with no
  entry silently inherits Pi defaults the canonical source deliberately does not state.
- **`PI_PACKAGES`** — runtime extension packages Pi loads for this project.
- **`model-policy` resolution** — `resolveTiers` maps each agent's abstract tier to a thinking level (and,
  only if the policy pins one, a model). The canonical source names tiers; the adapter names runtimes.

## Running it

```bash
node harness-core/adapters/pi/generate.mjs          # write .pi/
node harness-core/adapters/pi/generate.mjs --check  # fail (exit 1) if .pi/ has drifted, write nothing
node harness-core/adapters/pi/validate.mjs          # Pi's own loader accepts .pi/
node harness-core/adapters/pi/smoke.mjs             # Pi wires it together (grants, dispatch, tiers)
```

Or, from the repo root: `pnpm harness:generate`, `pnpm pi:check`, `pnpm pi:smoke`.

## Determinism

Generation is pure and sorted, so two runs with no source change produce byte-identical `.pi/`. The drift
check (`--check`, and `validate-generated.mjs`) rebuilds the tree in memory and compares. If `git diff`
after a second `pnpm harness:generate` is non-empty, the generator is non-deterministic — fix it, do not
commit the drift.

## What this adapter must not do

- Read or write a provider model identifier into canonical source.
- Keep a hand-maintained file under `.pi/`; every one of those is disposable.
- Approximate a capability it cannot express. If Pi cannot represent something, record it as unsupported.
