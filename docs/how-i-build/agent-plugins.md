# Agent model plugins: filters, ranking, fallback

> This document covers **the four OpenCode plugins under `.opencode/plugins/`**: what each owns,
> how they compose, and how to add one. Their registration lives in `.opencode/opencode.json`.

## The pipeline

The plugins form an ordered pipeline over the model list. Three **filters remove** models; one
**ranker never removes** — it orders, pins and recovers.

```text
all models
   │  free-model-filter      (cost)
   │  coding-model-filter    (tool capability)
   │  context-window-filter  (context size)
   ▼
surviving models
   │  auto-model-switch      (rank, pin default, fallback on failure)
   ▼
picker + runtime
```

A model removed by any filter is invisible to every later stage. A failure in the switch plugin
falls back down the ranking rather than re-adding removed models.

## The plugins

| Plugin                  | Responsibility                                                              | Options (default)                                     |
| ----------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| `free-model-filter`     | Cost selection only — keeps free models, or only paid ones                  | `freeOnly: true`, `freeMatch: ':free'`                |
| `coding-model-filter`   | Usability — requires `capabilities.tools === true`                          | `requireTools: true`                                  |
| `context-window-filter` | Context length only                                                         | `minContext: 131072`                                  |
| `auto-model-switch`     | Best-first ranking, pins the top model, labels ranks, falls back on failure | `maxRetries: 1`, `pinDefault: true`, `annotate: true` |

Each plugin has a README beside its `index.ts` that states its single responsibility and its
options. That is deliberate: the boundaries are the documentation.

## Configuration

`.opencode/opencode.json` registers all four for local use:

```json
"plugins": [
  { "package": "./plugins/free-model-filter", "options": { "freeOnly": false, "freeMatch": ":free" } },
  { "package": "./plugins/coding-model-filter", "options": { "requireTools": true } },
  { "package": "./plugins/context-window-filter", "options": { "minContext": 131072 } },
  { "package": "./plugins/auto-model-switch", "options": { "maxRetries": 1, "pinDefault": true, "annotate": true } }
]
```

The CI PR reviewer (`.github/workflows/opencode-review.yml`) uses the same four with
`freeOnly: true` and the free review model, so a fork-safe run never depends on a paid provider.

## Design rules

- **One responsibility per plugin.** A plugin that filters must not rank; a plugin that ranks must
  not remove.
- **Options are plain data.** No plugin reads environment state or another plugin's output directly;
  the pipeline order is the contract.
- **Removal is explicit.** If a model is dropped, one named filter did it, with a documented option.
- **Fallback never resurrects.** `auto-model-switch` only walks down the surviving ranking.

## Adding a plugin

1. Create `.opencode/plugins/<kebab-name>/` with `index.ts` (the plugin entry) and `README.md`
   stating responsibility, options and defaults.
2. Register it in `.opencode/opencode.json`; order it where its input is valid.
3. Keep it free of repository-specific paths unless it genuinely needs them.
4. There is no automated test harness for plugins today — an incorrect plugin fails at runtime, so
   the README's responsibility statement is the review artifact.
