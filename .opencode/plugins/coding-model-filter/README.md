# coding-model-filter

Keeps only models that are usable for coding work.

**Responsibility:** usability + tool capability only. It does not filter by cost (see `free-model-filter`) and does not filter by context size (see `context-window-filter`).

## Options

| Parameter      | Type      | Default | Description                                                                                                       |
| -------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `requireTools` | `boolean` | `true`  | Require `capabilities.tools === true`. Coding agents need tool calls, so models without tool support are removed. |

```jsonc
{
  "plugins": [
    {
      "package": "./plugins/coding-model-filter",
      "options": { "requireTools": true },
    },
  ],
}
```

## What it removes

- Models with `enabled: false`.
- Models whose `status` is present and not `"active"` (disabled / pending / failed providers).
- Models without tool support, when `requireTools` is on.

Everything else is left in place for the other plugins to decide.
