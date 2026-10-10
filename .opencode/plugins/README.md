# Plugins

Four OpenCode v2 plugins, each with a single responsibility. They compose through `ctx.model.transform`; filters remove models, the last plugin ranks what survives.

| Plugin                                             | Responsibility                                                                        | Key options                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`free-model-filter`](./free-model-filter)         | Keep free (or paid) models only                                                       | `freeOnly`, `freeMatch`                                 |
| [`coding-model-filter`](./coding-model-filter)     | Keep models usable for coding (active, enabled, tool-capable)                         | `requireTools`                                          |
| [`context-window-filter`](./context-window-filter) | Drop models with a context window below a threshold                                   | `minContext`                                            |
| [`auto-model-switch`](./auto-model-switch)         | Rank survivors by context tier + coding fit, pin/label the best, fall back on failure | `maxRetries`, `pinDefault`, `annotate`, `contextWeight` |

## Load order

List `auto-model-switch` **last** by convention. Note that plugin transforms do **not** see each other's removals — `editor.list()` always returns the raw set — so auto-model-switch reads the filtered set via `ctx.model.list()` instead of relying on order (see its README).

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "./plugins/free-model-filter",
      "options": { "freeOnly": true, "freeMatch": ":free" },
    },
    {
      "package": "./plugins/coding-model-filter",
      "options": { "requireTools": true },
    },
    {
      "package": "./plugins/context-window-filter",
      "options": { "minContext": 131072 },
    },
    {
      "package": "./plugins/auto-model-switch",
      "options": { "maxRetries": 1, "pinDefault": true, "annotate": true },
    },
  ],
}
```

Plugins under `.opencode/plugins/` are discovered automatically for their own location; the `plugins` array is what passes `options` through `ctx.options`. A location only sees configs it discovers — OpenCode searches the current location directory and its ancestors, so a service started elsewhere needs the registration in the config it actually loads (`~/.config/opencode/opencode.json`), with an absolute plugin path.

Restart the background service after editing a plugin or config:

```sh
opencode service restart
```

## Result with the options above

Free + tool-capable + context ≥ 131072, ranked by combined context + coding score with the best pinned as default and labelled `#1 …`, and failures falling back down that ranking.
