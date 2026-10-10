# auto-model-switch

Ranks the surviving models best-first, pins the best one as the default, labels every model with its rank in the picker, and falls back down that ranking when a model fails.

**Responsibility:** fallback ordering + failure recovery. This plugin never removes a model from the list.

## Options

| Parameter       | Type      | Default | Description                                                                               |
| --------------- | --------- | ------- | ----------------------------------------------------------------------------------------- |
| `maxRetries`    | `number`  | `1`     | Failures on one model before switching to the next.                                       |
| `pinDefault`    | `boolean` | `true`  | Pin the top-ranked model as the default model for new sessions.                           |
| `annotate`      | `boolean` | `true`  | Prefix each model's display name with `#rank size · ` (e.g. `#2 256K · North Mini Code`). |
| `contextWeight` | `number`  | `0.7`   | Share of the score that comes from context tier; `1 - contextWeight` goes to coding fit.  |

```jsonc
{
  "plugins": [
    {
      "package": "./plugins/auto-model-switch",
      "options": {
        "maxRetries": 1,
        "pinDefault": true,
        "annotate": true,
        "contextWeight": 0.7,
      },
    },
  ],
}
```

## Ranking

Both signals are normalised to `0..1`, then mixed: `contextWeight * contextScore + (1 - contextWeight) * codingScore`.

**Context score is tiered, not continuous.** Tiers are `2M > 1M > 512K > 256K > 131K`, each step worth `1/5`. A continuous log curve squashes real models into a narrow band — a 256K model and a 1M model end up less than one point apart — which lets a name keyword overturn a 4× difference in window. Tiering makes "bigger window first" a real guarantee.

**Coding score** = `0.65` if the model id/name contains `code`/`coder`/`coding`/`program`, plus `0.35` if `capabilities.reasoning` is true.

`capabilities.tools` is intentionally excluded: the filter plugins already require it, so it is constant across every surviving model and carries no ranking information.

### Why context leads

The two signals represent asymmetric costs:

- **Small context** — the conversation dies mid-task and you restart. A hard failure.
- **Generic model** — slightly worse answers, nothing breaks. A soft cost.

So context leads, and coding specialisation mainly breaks ties _within_ a tier. Tunable via `contextWeight`: raise it to make windows dominate, lower it to favour coding-specialised models.

Put this plugin **last** in the `plugins` array. It then:

- pins the top-ranked model as the default (`editor.default.set`), and
- labels each model `#n · ` in picker order (`editor.update`), where `n` is its rank among the **filtered** list (only the models that survived the filter plugins get numbers).

## How it sees the filtered list

Each plugin's `model.transform` runs against the raw model set — transforms do not observe each other's removals. So the ranking never reads `editor.list()` (that would rank all ~500 raw models, producing nonsense numbers like `#217`).

Instead it asynchronously reads `ctx.model.list()`, which does reflect every other plugin's filtering, caches that ranked list, and lets the transform synchronously annotate from the cache. When the filtered set changes (`model.updated`, plus delayed re-checks at startup), the cache refreshes and `model.reload()` re-applies the annotation.

This split is required: any `editor.*` mutation performed after an `await` inside a transform is silently dropped, so the transform itself must stay fully synchronous.

## Failure switching

Failure detection is deliberately dumb: any `session.step.failed` / `session.execution.failed` event whose error status is **not 2xx** means the model is unusable. No error-message parsing, no provider-specific logic.

On a qualifying failure the plugin:

1. de-duplicates the paired `step.failed` + `execution.failed` events (same signature within 5s counts once),
2. skips user-initiated aborts,
3. counts failures for `session|model`, and once `maxRetries` is reached, switches to the **next model down the ranking** via `ctx.session.switchModel`.

Current model per session comes from `session.model.selected` events, falling back to `session.get`.

## Notes

- The model picker's row order is decided by OpenCode itself: `editor.list()` hands back a copy and `ModelEditor` exposes no move/reorder/add, so display order cannot be reordered. What is controllable is the rank labels, the default selection, and the fallback chain.
- A user-initiated abort is not counted as a failure.
- The failed message is not re-sent automatically; the switch applies to the next prompt.
- Nothing happens when the failing model is the last one in the ranking.
- Every event is handled inside its own try/catch so one bad event can never kill the subscription loop.
